import { app } from "./app";

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(port, () => {
  console.log(`SlotSwapper backend listening on http://localhost:${port}`);
});


