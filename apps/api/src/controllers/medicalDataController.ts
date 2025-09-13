import type { Request, Response } from "express";
// import lighthouse from "@lighthouse-web3/sdk";
// import { LIGHTHOUSE_API_KEY } from "../config/ipfs";

export const uploadData = async (req: Request, res: Response) => {
  const { name, location, dataType } = req.body;
  console.log("Received data:", { name, location, dataType });

  // // Test Supabase connection by inserting and fetching a todo
  // const id = randomInt(1, 1000000);
  // const title = `Todo ${id}`;

  // const insertResult = await req.supabase.from("todos").insert({ id, title });
  // if (insertResult.error) {
  //   return res.status(500).json({ error: insertResult.error.message });
  // }

  // Fetch all todos
  const selectResult = await req.supabase.from("todos").select("*");
  if (selectResult.error) {
    return res.status(500).json({ error: selectResult.error.message });
  }

  // test ipfs

  // const text = "Sometimes, I Wish I Was A Cloud, Just Floating Along";
  // const response = await lighthouse.uploadText(text, LIGHTHOUSE_API_KEY);
  // console.log(response);

  console.log("Supabase data:", selectResult.data);
  res.status(201).json({
    message: "Data created",
    data: { name, location, dataType },
    todos: selectResult.data,
  });
};
