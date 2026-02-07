// Фото товаров (из frontend/photos). Импорты дают URL после сборки Vite.
import margaritta_pizza from "../../photos/margaritta_pizza.png";
import burgerandfries from "../../photos/burgerandfries.png";
import sushiset from "../../photos/sushiset.png";
import coffeeandcrousaint from "../../photos/coffeeandcrousaint.png";
import headphones from "../../photos/headphones.png";
import usbc from "../../photos/usbc.png";
import caseforphone from "../../photos/caseforphone.png";
import tShirt from "../../photos/t-shirt.png";
import sneackers from "../../photos/sneackers.png";
import Scentedcandle from "../../photos/Scentedcandle.png";
import gorshock from "../../photos/gorshock.png";

export const productPhotos = {
  "1": margaritta_pizza,
  "2": burgerandfries,
  "3": sushiset,
  "4": coffeeandcrousaint,
  "5": headphones,
  "6": usbc,
  "7": caseforphone,
  "8": tShirt,
  "9": sneackers,
  "10": Scentedcandle,
  "11": gorshock,
};

export function getProductPhotoUrl(productId) {
  return productPhotos[productId] || null;
}
