/* -----------------------------------------------

Script      : vaccine-widget.js
Author      : SEisele
Version     : 1.0.1
Description :
 Displays free appointment by param zip code and 
 vaccination variants.

 L920 = Biontec  
 L921 = Moderna  
 L922 = AstraZeneca

 76287 = Rheinstetten   
 76646 = Bruchsal Heidelsheim  
 76137 = Karlsruhe
 
Sounds:
    default
    accept
    alert
    complete
    event
    failure
    piano_error
    piano_success
    popup

Limitations:   
 * Noification (Siri) only working in Scriptable   
   App Mode and not in Widget mode.
 * Script link work only for german vaccination 
   center.

Changelog:
v1.0.1 - Adding Notification sound
v1.0.0 - Initial release
----------------------------------------------- */

// Zip Code Vaccination center; Vaccine type
const param = args.widgetParameter;
const paramArray = param ? param.split(";") : [""];
const plz = paramArray[0];
const type = paramArray[1];
const updateTime = paramArray.length == 1 && Number.isInteger(parseInt(paramArray[2])) && parseInt(paramArray[2]) > 0;

// update timer intervall
const startOfCurrentTime = (time) => (Math.floor(Date.now() / time) * time) + (new Date().getTimezoneOffset()*60*1000)
const oneMinInMillis = (1 * 60 * 1000)
const updateTimeInMillis = (updateTime * oneMinInMillis)
const currentTimeStartInMillis = startOfCurrentTime(updateTimeInMillis)
const currentTime = (Math.floor(new Date().getHours() / updateTime) * updateTime)

// Vaccination variants
let variant = "Not defined: ";
let biontec = "Biontec: ";
let moderna = "Moderna: ";
let astraZ = "AstraZeneca: ";
let myVar = "Empty ";

// Sound
let sound = "popup";

// Variant translator
if(type == "L920"){
  variant = biontec;
}
else if (type == "L921"){  
  variant = moderna;
}
else if (type == 'L922'){
  variant = astraZ;
}
else{
  variant = " ";
}

const apiData = await getNewCasesData();
const widgetSize = (config.widgetFamily ? config.widgetFamily : 'small');
const widget = await createWidget();

// For debug delete "!" from !config.runInWidget
if (!config.runInWidget) {
  switch(widgetSize) {
    case 'small': await widget.presentSmall();
    break;
    case 'large': await widget.presentLarge();
    break;
    default: // medium
    await widget.presentMedium();
  }
}

Script.setWidget(widget);
Script.complete();

//------------------------------------------------
// build the content of the widget
async function createWidget() {
  const list = new ListWidget();
  let gradient = new LinearGradient();
  gradient.locations = [0, 0.5];
  gradient.colors = [new Color("141414"), new Color("4974a5")];
  list.backgroundGradient = gradient;

  let row1 = list.addStack();
  row1.layoutHorizontally();
  row1.addSpacer(1);

  let column1 = row1.addStack();
  column1.layoutVertically();

  let column2 = row1.addStack();
  column2.layoutVertically();

  const logoImg = await getImage('termin.png');
  const logoStack = column2.addStack();

  if (widgetSize != 'small'){
    logoStack.addSpacer(60);
    list.setPadding(15, 25, 5, 25);
  }else{
    logoStack.addSpacer(14);
    list.setPadding(5, 5, 5, 5);
  }

  const logoImageStack = logoStack.addStack();
  logoStack.layoutHorizontally();
  logoImageStack.backgroundColor = new Color("#ffffff", 1.0);
  logoImageStack.cornerRadius = 6;
  const wimg = logoImageStack.addImage(logoImg);

  if(widgetSize != 'small'){
    wimg.imageSize = new Size(50, 50);
    wimg.rightAlignImage();
  }else{
    wimg.imageSize = new Size(40, 40);
    wimg.rightAlignImage();
  }
  const paperText = column1.addText("CORONA 🦠💉🧬");
  if(widgetSize != 'small'){
    paperText.textColor = Color.white();
    paperText.textOpacity = 0.5;
    paperText.font = Font.mediumRoundedSystemFont(20);
  }else{
    paperText.textColor = Color.white();
    paperText.textOpacity = 0.9;
    paperText.font = Font.mediumRoundedSystemFont(18);
  }
  list.addSpacer(8)
 
  const lastArtikel = list.addText("Free appointment");  
  if(widgetSize != 'small'){
    lastArtikel.font = Font.mediumRoundedSystemFont(18);
  }else{
    lastArtikel.font = Font.mediumRoundedSystemFont(14);
  }

  lastArtikel.textColor = new Color("#ffffff");
  var flag = new Boolean(apiData.termineVorhanden);

  // Notification Sound
  let notifi = new Notification();
  notifi.sound = sound;
 
  if(flag != true){
    myVar = " ❌";
  }else{
    myVar = " ✅";  
   //Notification Sound multiple times
   for (var i = 0; i <= 3; i++) {
        notifi.schedule();
   }
   // If vaccine is available siri will talk to you :)
   // at the moment it will only supported in the scriptable app (apple block siri in widget)
    // Speech.speak("Es gibt freie Impftermine schnell anrufen");
  }

  if(widgetSize != 'small'){
    list.addSpacer(8);
    const newPlz = list.addText("Zip Code: " + plz);
    newPlz.font = Font.regularSystemFont(20);
    list.addSpacer(4);
    const newArt = list.addText(variant + myVar);
    newArt.font = Font.regularSystemFont(20);
  }else{
    list.addSpacer(8);
    const newPlz = list.addText("Zip Code: " + plz);
    newPlz.font = Font.regularSystemFont(12);
    list.addSpacer(4);
    const newArt = list.addText(variant + myVar);
    newArt.font = Font.regularSystemFont(12);
  }
  list.addSpacer(4);
 
  const footer = list.addStack();
  footer.layoutHorizontally();
 
  const footerLeft = footer.addStack();
  footerLeft.backgroundColor = new Color('#a0a0a0', .6);
  footerLeft.cornerRadius = 3;
  footerLeft.setPadding(2, 4, 2, 4);

  const footerWidget = footerLeft.addText('impfterminservice.de');
  footerWidget.url = 'https://www.impfterminservice.de/impftermine';
  footerWidget.font = Font.mediumSystemFont(8);
  footerWidget.color = new Color('#efefef');

  footer.addSpacer(10);

 return list;
}

//------------------------------------------------
// url get json
async function getNewCasesData(){
  let url = "https://005-iz.impfterminservice.de/rest/suche/termincheck?plz="+plz+"&leistungsmerkmale="+type;
  let req = new Request(url);
  let apiResult = await req.loadJSON();

  return apiResult;
}

//------------------------------------------------
// get images from local filestore or download them once
async function getImage(image){
  let fm = FileManager.local();
  let dir = fm.documentsDirectory();
  let path = fm.joinPath(dir, image);
  
  if (fm.fileExists(path)) {
      return fm.readImage(path);
   }else{
       // download once
       let imageUrl;
       switch (image){
           case 'termin.png': imageUrl = "https://www.tf.uni-freiburg.de/de/bilder/icons/termin.png/image_preview";
               break;
           default:
               console.log(`Sorry, couldn't find ${image}.`);
        }
       let iconImage = await loadImage(imageUrl);
       fm.writeImage(path, iconImage);

    return iconImage;
   }
}

//------------------------------------------------
// helper function to download an image from a given url
async function loadImage(imgUrl){
   const req = new Request(imgUrl);

  return await req.loadImage();
}

// end of script copy until here 
