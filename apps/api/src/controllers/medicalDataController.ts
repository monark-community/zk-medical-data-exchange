import type { Request, Response } from "express";

export const uploadData = async (req: Request, res: Response) => {
  const { name, location, dataType } = req.body;
  console.log("Received data:", { name, location, dataType });

  // test supabase
  const selectResult = await req.supabase.from("todos").select("*");
  if (selectResult.error) {
    return res.status(500).json({ error: selectResult.error.message });
  }
  console.log("Supabase data:", selectResult.data);

  return res.status(201).json({ name, location, dataType });
};
