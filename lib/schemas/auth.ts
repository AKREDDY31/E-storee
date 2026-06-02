import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/\d/, "Password must contain at least one number");

const registerBaseSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  age: z.coerce.number().optional(),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().regex(/^\d{10}$/, "Phone number must be 10 digits"),
  password: passwordSchema,
  secretCode: z.string().trim().min(4, "Secret code is required")
});

export const registerSchema = registerBaseSchema;

export const registerSchemaValidated = registerBaseSchema.superRefine((data, ctx) => {
  if (data.age == null) {
    return;
  }

  if (!Number.isFinite(data.age)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["age"],
      message: "Enter a valid age"
    });
    return;
  }

  if (!Number.isInteger(data.age)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["age"],
      message: "Age must be a whole number"
    });
  }

  if (data.age < 13) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["age"],
      message: "Age must be at least 13"
    });
  }

  if (data.age > 120) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["age"],
      message: "Enter a valid age"
    });
  }
});

export const registerEmailLinkSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Enter a valid email address")
});

export const registerPhoneSendSchema = z.object({
  phone: z.string().trim().regex(/^\d{10}$/, "Phone number must be 10 digits"),
  otpChannel: z.enum(["sms", "whatsapp"]).optional(),
  purpose: z.enum(["register", "password_reset"]).default("register")
}).superRefine((data, ctx) => {
  if (!data.otpChannel) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["otpChannel"],
      message: "Select a phone OTP delivery method"
    });
  }
});

export const registerPhoneVerifySchema = z.object({
  phone: z.string().trim().regex(/^\d{10}$/, "Phone number must be 10 digits"),
  otp: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6 digit OTP"),
  purpose: z.enum(["register", "password_reset"]).default("register")
});

export const registerCompleteSchema = registerBaseSchema.extend({
  confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters")
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["confirmPassword"],
      message: "Passwords do not match"
    });
  }
});

// Backward-compatible aliases for existing imports.
export const registerStartSchema = registerEmailLinkSchema;
export const registerVerifySchema = registerPhoneVerifySchema;

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["user", "admin"])
});

export const adminRegisterSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().regex(/^\d{10}$/, "Phone number must be 10 digits"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number"),
  secretCode: z.string().trim().min(4, "Secret code is required")
});

export const forgotPasswordSchema = z.object({
  role: z.enum(["user", "admin"]),
  email: z.string().trim().email("Enter a valid email address"),
  secretCode: z.string().trim().min(4, "Secret code is required"),
  confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
  newPassword: passwordSchema
}).superRefine((data, ctx) => {
  if (data.newPassword !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["confirmPassword"],
      message: "Passwords do not match"
    });
  }
});

export const passwordResetStartSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().regex(/^\d{10}$/, "Phone number must be 10 digits"),
  otpChannel: z.enum(["sms", "whatsapp"])
});

export const passwordResetVerifySchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().regex(/^\d{10}$/, "Phone number must be 10 digits"),
  otp: registerPhoneVerifySchema.shape.otp,
  newPassword: passwordSchema
});
