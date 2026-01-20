'use client';
import {CountrySelectField} from '@/components/forms/CountryFieldSelect';
import FooterLink from '@/components/forms/FooterLink';
import InputField from '@/components/forms/InputField';
import SelectField from '@/components/forms/SelectField';
import { Button } from '@/components/ui/button';
import { signUpWithEmail } from '@/lib/actions/auth.actions';
import { INVESTMENT_GOALS, PREFERRED_INDUSTRIES, RISK_TOLERANCE_OPTIONS } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import React from 'react'
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

const SignUp = () => {
    const rounter = useRouter();
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm<SignUpFormData>({
        defaultValues: {
            fullName: '',
            email: '',
            password: '',
            country: 'Canada',
            investmentGoals: 'Growth',
            riskTolerance: 'Medium',
            preferredIndustry: 'Technology',
        },
        mode: 'onBlur',
    });
    const onSubmit = async (data: SignUpFormData) => {
        try {
            const result = await signUpWithEmail(data);
            if (result.success) 
                {
                    rounter.push('/');
                }
        }
        catch (error: unknown) {
            toast.error('Sign Up Error:',{
                description: error instanceof Error ? error.message : 'An unexpected error occurred during sign-up.',
            });
        }
    }
    return (
        <>
            <h1 className='form-title'>Sign Up & Personalize</h1>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
                <InputField
                    name="fullName"
                    label="Full Name"
                    placeholder="John Doe"
                    type="text"
                    validation={{ required: 'Full Name is required' }}
                    error={errors.fullName}
                    register={register}
                    disabled={false}
                />
                <InputField
                    name="email"
                    label="Email Address"
                    placeholder="john.doe@example.com"
                    type="text"
                    validation={{ required: 'Email Address is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' } }}
                    error={errors.email}
                    register={register}
                    disabled={false}
                />
                <InputField
                    name="password"
                    label="Password"
                    placeholder="Enter your password"
                    type="password"
                    validation={{ required: 'Password is required' }}
                    error={errors.password}
                    register={register}
                    disabled={false}
                />
                <CountrySelectField
                    name="country"
                    label="Country"
                    control={control}
                    error={errors.country}
                    required
                />
                {/* Additional personalization fields can be added here */}
                <SelectField
                name = "investmentGoals"
                label="Select your investment Goals"
                placeholder="Investment Goals"
                options={INVESTMENT_GOALS}
                control={control}
                error={errors.investmentGoals}
                />
                <SelectField
                name = "riskTolerance"
                label="Select your Risk Tolerance"
                placeholder="Risk Tolerance"
                options={RISK_TOLERANCE_OPTIONS}
                control={control}
                error={errors.riskTolerance}
                />
                <SelectField
                name = "preferredIndustry"
                label="Select your Preferred Industry"
                placeholder="Preferred Industry"
                options={PREFERRED_INDUSTRIES}
                control={control}
                error={errors.preferredIndustry}
                />
                <Button type='submit' className=' yellow-btn mt-4' disabled={isSubmitting}>
                    {isSubmitting ? 'Signing Up...' : 'Sign Up'}
                </Button>
                <FooterLink text="Already have an account?" linkText="Sign In" href="/sign-in" />

            </form>
        </>
    )
}

export default SignUp
