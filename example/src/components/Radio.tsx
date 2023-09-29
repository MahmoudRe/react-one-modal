import { InputHTMLAttributes } from 'react'

export default function RadioJoin(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className='join-item btn btn-neutral'
      style={{ ['--p' as any]: 'var(--a)', ['--pf' as any]: 'var(--af)' }}
      type='radio'
      aria-label={props.value as string}
      {...props}
    />
  )
}
