'use server';

import { connectToDatabase } from "@/database/mongoose";

export const getAllUsersForNewsEmail = async () => {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error("Database connection not found");

        // Query Better Auth users collection
        const users = await db.collection('user').find(
            {
                email: { $exists: true, $ne: null }
            },
            {
                projection: { _id: 1, name: 1, email: 1, image: 1 }
            }
        ).toArray();

        return users.filter((user) => user.email && user.name).map((user) => ({
            id: user._id.toString(),
            name: user.name,
            email: user.email,
        }));
    } catch (error) {
        console.error("Error fetching users for news email:", error);
        return [];
    }
}