import { z } from "zod";

const schema = z.object({
  username: z
    .string({ message: "Username is required" })
    .trim()
    .min(1, { message: "Username is required" }),
  password: z
    .string({ message: "Password is required" })
    .min(8, { message: "Password should be atleast 8 characters" })
    .max(15, { message: "Password should be between 8 and 15 characters" }),
});

export default schema;
