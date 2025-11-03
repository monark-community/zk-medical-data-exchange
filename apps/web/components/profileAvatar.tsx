"use client";
import { useMemo } from "react";
import { createAvatar } from "@dicebear/core";
import { glass } from "@dicebear/collection";
import { useAccount } from "wagmi";

const ProfileAvatar = ({ size, radius }: { size: number; radius: number }) => {
  const { address } = useAccount();

  const avatar = useMemo(() => {
    return createAvatar(glass, {
      seed: address,
      size: size,
      radius: radius,
    }).toDataUri();
  }, []);

  return <img src={avatar} alt="Avatar" />;
};

export default ProfileAvatar;
