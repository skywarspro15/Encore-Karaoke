import Vfs from "./vfs.js";

async function getAppListing() {
  await Vfs.importFS();
  try {
    appList = JSON.parse(await Vfs.readFile("Root/CherryTree/user/apps.json"));
  } catch (e) {
    // parsing error :(
    await Vfs.delete("Root/CherryTree/user/apps.json");
    await Vfs.merge();
    return await getAppListing();
  }
}
async function setAppListing(newAppListing) {
  await Vfs.writeFile(
    "Root/CherryTree/user/apps.json",
    JSON.stringify(newAppListing)
  );
}

let appList;

export default {
  async launchApp(id) {
    await getAppListing();
    console.log(appList);
    let appI = appList.list.findIndex((i) => i.id === id);
    let app = appList.list[appI];
    appList.list.splice(appI, 1);
    app.lastPlayed = Date.now();
    appList.list.unshift(app);
    await setAppListing(appList);
  },
  async sortAppList() {
    await getAppListing();
    /**@type array */
    let list = appList.list;
    list.sort((a, b) => a.lastPlayed - b.lastPlayed);
    console.log(
      "Sorted:",
      list.map((a) => a.lastPlayed)
    );
  },
  async resetAppList() {
    await getAppListing();
    await Vfs.delete("Root/CherryTree/user/apps.json");
    await Vfs.merge();
    await getAppListing();
  },
};
