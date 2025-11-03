"use client";

import React from "react";
import ProfileCard from "./components/profileCard";
import CustomNavbar from "@/components/navigation/customNavBar";

export default function Profile() {
  return (
    <div className="min-h-screen bg-gray-50">
      <CustomNavbar />
      <main className="flex min-h-screen flex-col items-center gap-10 px-4 py-8">
        <ProfileCard />
      </main>
    </div>
  );
}
