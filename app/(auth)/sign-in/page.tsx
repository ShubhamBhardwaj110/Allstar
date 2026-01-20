'use client';
import FooterLink from '@/components/forms/FooterLink';
import InputField from '@/components/forms/InputField';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';

const SignIn = () => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignInFormData>({
        defaultValues: {
            email: '',
            password: '',

        },
        mode: 'onBlur',
    });
    const onSubmit = async (data: SignInFormData) => {
        try {
            console.error('Sign In Data:', data);
        }
        catch (error: unknown) {
            console.error('Sign In Error:', error);
        }
    }
  return (
    <>

            <h1 className='form-title'>Sign Up & Personalize</h1>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>

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
                                <Button type='submit' className=' yellow-btn mt-4' disabled={isSubmitting}>
                    {isSubmitting ? 'Signing In...' : 'Sign In'}
                </Button>
                <FooterLink text="Don't have an account?" linktext="Sign Up" href="/sign-up" />
            </form>
        </>
    )
}

export default SignIn
