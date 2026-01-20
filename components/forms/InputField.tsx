import { Label } from '@/components/ui/label'
import React from 'react'
import { Input } from '../ui/input'
import { cn } from '@/lib/utils'

const InputField = ({name,label,placeholder,type="text",validation,error,register,disabled}: FormInputProps) => {
  return (
    <div className='space-y-5'>
      <Label htmlFor={name} className='form-label block mb-2'>
        {label}
      </Label>
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className={cn('form-input',{'opacity-50 cursor-not-allowed': disabled})}
        {...register(name, validation)}
      />
      {error && <p className='form-error' style={{ color: 'red' }}>{error.message}</p>}
    </div>
  )
}

export default InputField
