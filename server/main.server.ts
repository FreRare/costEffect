import {app} from "./server";

export async function start() {
  try {
    app.listen(process.env.PORT, () => {
      console.log(`Server is up an listening on http://localhost:${process.env.PORT}`);
    })
  } catch (e) {
    console.error(e);
  }
}
