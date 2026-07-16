import { PublicUser } from "../models/User";

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}
