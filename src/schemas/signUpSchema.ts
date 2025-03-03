import {z} from 'zod'

export const usernameValidation = z
    .string()
    .min(2, "Username must be atleast 2 characters")
    .max(30, "Username must not be more than 30 characters")
    .regex(/^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{0,29}$/, "Username must not contain special character")

export const singUpSchema = z.object({
    username: usernameValidation,
    email: z.string().email({message: "Invalid email address"}),
    password: z.string().min(8, {message: "Password must be atleast 8 characters"})
})