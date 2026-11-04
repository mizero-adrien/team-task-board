<<<<<<< HEAD
=======
import type { UserRole } from "../models/User";

>>>>>>> 0cbe3a92cb8cd89b942609132c01df61bdf1c61f
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
<<<<<<< HEAD
        role: "user" | "admin";
=======
        name: string;
        email: string;
        role: UserRole;
>>>>>>> 0cbe3a92cb8cd89b942609132c01df61bdf1c61f
      };
    }
  }
}

<<<<<<< HEAD
export {};
=======
export {};
>>>>>>> 0cbe3a92cb8cd89b942609132c01df61bdf1c61f
