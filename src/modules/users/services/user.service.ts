import { User } from "../models/user.model";
import { UserDevice } from "../models/user-device.model";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCodes } from "../../../common/constants/error-codes.constants";

export class UserService {
    async registerDevice(userId: string, deviceToken: string): Promise<void> {
        await UserDevice.findOneAndUpdate(
            { userId, fcmToken: deviceToken },
            { active: true, lastSeenAt: new Date() },
            { upsert: true }
        );
    }

    sanitizeUser(user: any): any {
        const { password, __v, ...userData } = user.toObject ? user.toObject() : user;
        return userData;
    }
}
