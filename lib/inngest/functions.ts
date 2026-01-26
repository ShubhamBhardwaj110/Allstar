import { send } from "process";
import { inngest } from "./client";
import { PERSONALIZED_WELCOME_EMAIL_PROMPT, NEWS_SUMMARY_EMAIL_PROMPT } from "./prompts";
import { sendWelcomeEmail, sendNewsEmailToUser } from "../nodemailer";
import { step } from "inngest";
import { get } from "http";
import { getAllUsersForNewsEmail } from "../actions/user.actions";
import { getWatchlistSymbolsByEmail } from "../actions/watchlist.actions";
import { getNews } from "../actions/finnhub.actions";
import { success } from "better-auth";

// Import the FormattedArticle type from finnhub.actions
type FormattedArticle = {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image?: string;
  datetime: string;
};

export const sendSignUpEmail = inngest.createFunction(
    {id:'sign-up-email'},
    {event:'app/user.created'},
    async ({event, step}) => {
        // Logic to send sign-up email
        const userProfile = `
            -Country: ${event.data.country}
            -Investment goals: ${event.data.investmentGoals}
            -Risk tolerance: ${event.data.riskTolerance}
            -Preferred industry: ${event.data.preferredIndustries}
            `
            const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace('{{userProfile}}', userProfile)
            
            let introText = 'Welcome to Allstar! We are thrilled to have you on board.';
            
            try {
                const response = await step.ai.infer('generate-welcome-intro',{
                    model: step.ai.models.gemini({model: 'gemini-2.5-flash-lite'}),
                    body:{
                        contents:[{
                            role: 'user',
                            parts:[{
                                text: prompt
                            }]
                        }]
                    }
                });
                const part = response.candidates?.[0]?.content?.parts?.[0];
                introText = (part && 'text' in part ? part.text : null) || introText;
            } catch (aiError) {
                console.error('AI inference failed, using default intro:', aiError);
                // Continue with default intro - don't block email sending
            }
            
            await step.run('send-welcome-email', async () => {
                return await sendWelcomeEmail({
                    email: event.data.email,
                    name: event.data.name,
                    intro: introText
                });
            });
            
            return {
                success: true,
                message: 'Sign-up email sent successfully',
            }
    }
);
export const sendDailyNewsSummary = inngest.createFunction(
    {id:'daily-news-summary'},
    {cron: '0 12 * * *'},
    async ({step}) => {
        console.log('🔄 Starting daily news summary function');
        
        // Step 1: Get all users for daily news
        const users = await step.run('get-all-users', getAllUsersForNewsEmail);
        console.log(`✅ Step 1: Found ${users?.length || 0} users`);
        
        if(!users || users.length === 0) {
            console.log('❌ No users found');
            return {success:false, message:'No users found for daily news email'};
        }
        
        // Step 2: Fetch personalized news for each user
        const newsResults = await step.run('fetch-personalized-news', async () => {
            console.log('🔄 Step 2: Fetching news for users...');
            const userNewsMap: Record<string, { email: string; name: string; articles: FormattedArticle[] }> = {};
            
            for (const user of users) {
                try {
                    const symbols = await getWatchlistSymbolsByEmail(user.email);
                    let articles = [];
                    
                    if (symbols && symbols.length > 0) {
                        articles = await getNews(symbols);
                    } else {
                        articles = await getNews();
                    }
                    
                    // Convert MarketNewsArticle to FormattedArticle
                    const formattedArticles: FormattedArticle[] = articles.slice(0, 6).map((article: MarketNewsArticle) => ({
                        id: String(article.id),
                        headline: article.headline,
                        summary: article.summary,
                        source: article.source,
                        url: article.url,
                        image: article.image,
                        datetime: new Date(article.datetime * 1000).toISOString(),
                    }));
                    
                    userNewsMap[user.email] = {
                        email: user.email,
                        name: user.name,
                        articles: formattedArticles
                    };
                } catch (error) {
                    console.error(`Error fetching news for ${user.email}:`, error);
                    userNewsMap[user.email] = {
                        email: user.email,
                        name: user.name,
                        articles: []
                    };
                }
            }
            
            console.log('✅ Step 2 Complete');
            return userNewsMap;
        });
        
        // Step 3: Generate AI summaries for all users
        console.log('🔄 Step 3: Generating AI summaries...');
        const summaries: Record<string, string> = {};
        
        for (const [email, userData] of Object.entries(newsResults)) {
            try {
                if (userData.articles.length === 0) {
                    summaries[email] = '<p>No news available today.</p>';
                } else {
                    try {
                        const newsDataFormatted = userData.articles
                            .map((article: FormattedArticle, index: number) => {
                                return `${index + 1}. "${article.headline}" - ${article.source}\nSummary: ${article.summary}`;
                            })
                            .join('\n\n');
                        
                        const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace('{{newsData}}', newsDataFormatted);
                        console.log(`  🤖 Generating summary for ${email}...`);
                        
                        // Retry logic with exponential backoff for rate limiting
                        let retries = 0;
                        let lastError;
                        while (retries < 3) {
                            try {
                                const response = await step.ai.infer('generate-news-summary-' + email, {
                                    model: step.ai.models.gemini({model: 'gemini-2.5-flash-lite'}),
                                    body: {
                                        contents: [{
                                            role: 'user',
                                            parts: [{text: prompt}]
                                        }]
                                    }
                                });
                                
                                const part = response.candidates?.[0]?.content?.parts?.[0];
                                summaries[email] = (part && 'text' in part ? part.text : null) || '<p>Market news ready.</p>';
                                console.log(`  ✅ Summary generated`);
                                break;
                            } catch (error: any) {
                                lastError = error;
                                if (error.message?.includes('429') && retries < 2) {
                                    retries++;
                                    const delay = Math.pow(2, retries) * 1000; // 2s, 4s
                                    console.log(`  ⏳ Rate limited, waiting ${delay}ms...`);
                                    await new Promise(resolve => setTimeout(resolve, delay));
                                } else {
                                    throw error;
                                }
                            }
                        }
                    } catch (aiError) {
                        console.warn(`  ⚠️ AI failed:`, aiError);
                        summaries[email] = '<p>Market news highlights available.</p>';
                    }
                }
            } catch (error) {
                console.error(`  ❌ Error generating summary for ${email}:`, error);
                summaries[email] = '<p>Unable to generate summary.</p>';
            }
        }
        
        // Step 4: Send emails
        const emailResults = await step.run('send-news-emails', async () => {
            console.log('🔄 Step 4: Sending emails...');
            const results: Record<string, boolean> = {};
            
            for (const [email, userData] of Object.entries(newsResults)) {
                try {
                    console.log(`  📮 Sending to ${userData.email}...`);
                    await sendNewsEmailToUser({
                        email: userData.email,
                        name: userData.name,
                        newsContent: summaries[email] || '<p>Market news ready.</p>',
                        articleCount: userData.articles.length
                    });
                    console.log(`  ✅ Email sent to ${userData.email}`);
                    results[email] = true;
                } catch (error) {
                    console.error(`  ❌ Error sending email to ${userData.email}:`, error);
                    results[email] = false;
                }
            }
            
            console.log('✅ Step 4 complete - all emails sent');
            return results;
        });
        
        return { success: true, message: `News summary sent to ${Object.keys(newsResults).length} users` };
    }
);