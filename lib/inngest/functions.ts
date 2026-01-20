import { send } from "process";
import { inngest } from "./client";
import { PERSONALIZED_WELCOME_EMAIL_PROMPT } from "./prompts";
import { sendWelcomeEmail } from "../nodemailer";

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
            })
            await step.run('send-welcome-email',async()=>{
                const part =  response.candidates?.[0]?.content?.parts?.[0];
                const introText = (part && 'text' in part? part.text:null) || 'Welcome to Allstar! We are thrilled to have you on board.';
                //email sending logic
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