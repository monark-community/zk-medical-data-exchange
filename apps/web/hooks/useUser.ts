import { User } from "@/interfaces/user";
import { getUser } from "@/services/api/userService";
import React from "react";
import { useAccount } from "wagmi";
import emitter from "@/lib/eventBus";

export function useUser() {
  const { address } = useAccount();
  const [user, setUser] = React.useState<User>({ id: "", username: "", createdAt: "" });

  const fetchUserData = React.useCallback(async () => {
    if (!address) return;

    try {
      const userData = await getUser(address);
      setUser(userData);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  }, [address]);

  React.useEffect(() => {
    fetchUserData();
    const handleUserUpdated = () => {
      fetchUserData();
    };

    emitter.on("userUpdated", handleUserUpdated);

    return () => {
      emitter.off("userUpdated", handleUserUpdated);
    };
  }, [fetchUserData]);

  return { user, refetchUser: fetchUserData };
}
