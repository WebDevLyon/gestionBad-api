//Import
const puppeteer = require('puppeteer')

exports.getAll = (req,res,next)=>{
	let url = req.body.url ? req.body.url : 'http://badiste.fr/selection-tournoi/asmc69-138.htmlhttp://badiste.fr/selection-tournoi/ASMC69-138.html?date=100'
	/** 
    * !Le site contenant les ressources ne dispose pas d'api...
    * *Récupération par scraping avec puppeteer
    */
	
	//Création de la session de navigation Chronium
	async function startBrowser(){
		let browser
		try{
			console.log('Ouverture du navigateur')
			browser = await puppeteer.launch({
				headless: false, //true en production
				args: ['--disable-setuid-sandbox'],
				ignoreHTTPSErrors: true,
			})
		}catch(err){
			console.log('Erreur dans la création du browser : ', err)
		}
		return browser
	}

	/*
    * *Navigation sur la page à scraper
    */
	const scraperObject = {
		tournoiArray: [],
		async scraper(browser) {
			let page = await browser.newPage()
			console.log(`Navigation vers ${url}...`)
			await page.goto(url)
			// Rendu total du DOM
			await page.waitForSelector('.toptable')
			// Obtenir les liens des tournois à scraper
			//! Par défaut uniquement les tournois futurs sont sélectionnés, il nous faut tous les tournois
			let urls = await page.$$eval('table.tux tr', (links) => {
				// Filtre pour récupérer seulement les éléments contenant les liens souhaités
				links = links.filter((link) => link.querySelector('td'))
    
				// Extraction des liens : il s'agit du dernier liens*/
				links = links.map((el) => el.querySelector('a:last-of-type').href)
				return links
			})
			console.log('list des urls : ', urls)
			// Loop through each of those links, open a new page instance and get the relevant data from them
			let pagePromise = (link) =>
				new Promise(async (resolve, reject) => {
					let dataObj = {}
					let newPage = await browser.newPage()
					await newPage.goto(link)
					dataObj['linkTournoi'] = link
					dataObj['nomTournoi'] = await newPage.$eval(
						'h2',
						(text) => text.textContent
					)
					dataObj['dateLimite'] = await newPage.$eval(
						'tr:nth-of-type(4) td:nth-of-type(2)',
						(text) => text.textContent
					)
					dataObj['serie'] = await newPage.$eval(
						'tr:nth-of-type(8) td:nth-of-type(2)',
						(text) => text.textContent
					)
					dataObj[
						'adresse'
					] = await newPage.$eval(
						'tr:nth-of-type(10) td:nth-of-type(2)',
						(text) => text.innerHTML.split('GPS')[0].split('<br>').join(' ')
					)
					resolve(dataObj)
					await newPage.close()
				})
    
			for (link in urls) {
				let currentPageData = await pagePromise(urls[link])
				// scrapedData.push(currentPageData);
				console.log(currentPageData)
				this.tournoiArray.push(currentPageData)
			}
			//save des tournois sur la DB s'ils n'existe pas déjà
			this.tournoiArray.forEach((tournoi) => {
				//on vérifie s'il n'est pas déjà dans la DB
				Associate.findOne({ name: 'Association Sportive Marcy Charbonnière' })
					.then((associateFind) => {
						if (!associateFind) {
							console.log('pb')
						} else {
							for (var i = 0; i < associateFind.tournoisSelected.length; i++) {
								if (
									associateFind.tournoisSelected[i].linkTournoi ===
                      tournoi.linkTournoi
								) {
									console.log('existe deja')
								}
							}
							associateFind.tournoisSelected.push(tournoi)
							associateFind
								.save()
								.then(() => console.log('tournois save')) //console.log("tournois save", associateFind))
								.catch((error) => res.status(400).json({ error }))
    
							//Ci dessous si on travail sur la table Tournoi
							/* const newTournoi = new Tournoi({
                    nom: tournoi.nomTournoi,
                    link: tournoi.linkTournoi,
                    serie: tournoi.serie,
                    dateLimite: new Date(tournoi.dateLimite),
                    adresse: tournoi.adresse,
                  });
                  newTournoi
                    .save()
                    .then(() => console.log("tournois save"))
                    .catch((error) => res.status(400).json({ error }));*/
						}
					})
					.catch((err) => res.status(500).json({ err }))
			})
		},
	}
	/*END*/
    
	/*Page controllers*/
	async function scrapeAll(browserInstance) {
		let browser
		try {
			browser = await browserInstance
			await scraperObject.scraper(browser)
		} catch (err) {
			console.log('Could not resolve the browser instance => ', err)
		}
	}
	/*END*/
    
	//Start the browser and create a browser instance
	let browserInstance = startBrowser()
	// Pass the browser instance to the scraper controller
	scrapeAll(browserInstance)
}