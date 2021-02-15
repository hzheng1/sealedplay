let main = async () => {
	let retrieveCardsWithRarity = async () => {
		const tables = Array.prototype.slice.call(
			document.querySelectorAll('table')
		);
		const cardLists = tables.filter((table) => {
			const parentTitle = table.parentElement.title.trim();
			if (parentTitle != 'English' && parentTitle != 'North American') {
				return false;
			}
			const colNames = new Set(
				Array.prototype.slice
					.call(table.querySelectorAll('thead th'))
					.map((th) => th.innerText.trim().toLowerCase())
			);
			return (
				(colNames.has('card number') || colNames.has('set number')) &&
				colNames.has('rarity') &&
				colNames.has('category')
			);
		});
		cardLists.sort((a, b) => {
			score = (x) => {
				switch (x.parentElement.title.trim()) {
					case 'English':
						return 0;
					case 'North American':
						return 1;
					default:
						return 2;
				}
			};
			return score(a) - score(b);
		});
		const cardList = cardLists[0];
		const colNames = Array.prototype.slice
			.call(cardList.querySelectorAll('thead th'))
			.map((th) => th.innerText.trim().toLowerCase());
		let cardNumberIndex = colNames.indexOf('card number');
		if (cardNumberIndex == -1) {
			cardNumberIndex = colNames.indexOf('set number');
		}
		const rarityIndex = colNames.indexOf('rarity');
		const categoryIndex = colNames.indexOf('category');
		const cards = [];
		const dataFetcherPromises = Array.prototype.slice
			.call(cardList.querySelectorAll('tbody tr'))
			.map((row) => {
				const rowText = Array.prototype.slice
					.call(row.querySelectorAll('td'))
					.map((x) => x.innerText);
				const cardNumber = rowText[cardNumberIndex];
				const rarity = rowText[rarityIndex];
				const category = rowText[categoryIndex].toLowerCase();
				return fetch(`https://yugioh.fandom.com/wiki/${cardNumber}`)
					.then((res) => res.text())
					.then((html) => {
						console.log(cardNumber);
						const image = html.match(
							/"cardtable-cardimage".+<img[^>]+src\s*=\s*"([^"]+)"/
						)[1];
						const title = html
							.match(/<title>([^<]+)<\/title>/)[1]
							.split('|')[0]
							.trim();
						switch (title) {
						}
						const passcode = (() => {
							switch (title) {
								case 'Obelisk the Tormentor':
									return '10000001';
								case 'Slifer the Sky Dragon':
									return '10000021';
								case 'The Winged Dragon of Ra':
									return '10000011';
								default:
									return html.match(/<a\s*href\s*[^>]+title\s*=\s*"(\d{8})/)[1];
							}
						})();
						cards.push({
							cardNumber,
							rarity,
							isExtra: !!category.match(/(?:fusion|synchro|xyz|link)/),
							image,
							passcode,
						});
					});
			});
		return Promise.all(dataFetcherPromises).then(() => {
			return cards.sort((a, b) => a.cardNumber.localeCompare(b.cardNumber));
		});
	};

	let cards = await retrieveCardsWithRarity();
	let cardsByRarity = {};
	cards.forEach((card) => {
		if (!(card.rarity in cardsByRarity)) {
			cardsByRarity[card.rarity] = [];
		}
		cardsByRarity[card.rarity].push(card);
	});

	console.log(cards);

	let popupHtml = `
<style type="text/css">
	.column {
	  float: left;
	}

	.left {
	  width: 75%;
	}

	#main {
		overflow-y: scroll;
	  height: 95%;
	}

	.right {
	  width: 25%;
	}

	.card-thumbnail {
		width: 144px;
		margin: 8px;
	}

	.card-thumbnail.flip1 {
		transition: .5s ease-in-out;
		transform: scale(0, 1);
	}

	.card-thumbnail.flip2 {
		transition: .5s ease-in-out;
		transform: scale(1, 1);
	}

	.selected.extra {
		outline: 4px solid blue;
	}

	.selected {
		outline: 4px solid red;
	}
</style>
<div class="row">
	<div class="column left" >
		<button id="add">
			Open Booster
		</button>
		<button id="add-shown">
			Open Revealed Booster
		</button>
		<button id="sort">
			Sort
		</button>
		<button id="export">
			Export
		</button>
		<button id="select-all">
			Click All
		</button>
		<br />
		<div id="main">
		</div>
	</div>
	<div class="column right">
		<img id="preview" width="100%"></img>
	</div>
</div>`;

	let createSelector = () => {
		const randomElem = (arr) => {
			return arr[Math.floor(Math.random() * arr.length)];
		};
		const url = [location.protocol, '//', location.host, location.pathname]
			.join('')
			.replace('https://yugioh.fandom.com/wiki/', '');
		switch (url) {
			case 'Battle_Pack:_Epic_Dawn':
				return () => {
					let slot1 = cards.slice(0, 55);
					let slot2 = cards.slice(55, 110);
					let slot3 = cards.slice(110, 170);
					let slot4 = cards.slice(170);
					return [
						randomElem(slot1),
						randomElem(slot2),
						randomElem(slot3),
						randomElem(slot4),
						randomElem(cards),
					];
				};
			case 'Battle_Pack_2:_War_of_the_Giants':
				return () => {
					let commons = cardsByRarity['Common\nMosaic Rare'];
					let rares = cardsByRarity['Rare\nMosaic Rare'];
					return [
						randomElem(rares),
						randomElem(commons),
						randomElem(commons),
						randomElem(commons),
						randomElem(cards),
					];
				};
			default:
				return () => {
					let commons = cardsByRarity['Common'];
					let rares = cardsByRarity['Rare'];
					let others = [];
					for (let key in cardsByRarity) {
						if (key == 'Common' || key == 'Rare') {
							continue;
						}
						others.push(...cardsByRarity[key]);
					}
					return [
						randomElem(commons),
						randomElem(commons),
						randomElem(commons),
						randomElem(commons),
						randomElem(commons),
						randomElem(commons),
						randomElem(commons),
						randomElem(rares),
						randomElem(others),
					];
				};
		}
	};

	let selector = createSelector();

	let win = window.open(
		'',
		'Sealed Play Card Selector',
		'toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes'
	);
	win.document.body.innerHTML = popupHtml;

	let popupHandler = (document) => {
		const CARD_BACK =
			'https://vignette.wikia.nocookie.net/yugioh/images/e/e5/Back-EN.png/revision/latest?cb=20100726082133';

		const download = (filename, text) => {
			let element = document.createElement('a');
			element.setAttribute(
				'href',
				'data:text/plain;charset=utf-8,' + encodeURIComponent(text)
			);
			element.setAttribute('download', filename);

			element.style.display = 'none';
			document.body.appendChild(element);

			element.click();

			document.body.removeChild(element);
		};

		const createElement = (html) => {
			const div = document.createElement('div');
			div.innerHTML = html.trim();
			return div.firstChild;
		};

		const addCards = (revealed) => {
			let newCards = selector();
			newCards.forEach((elem) => {
				const newCard = createElement(
					`<img class="card-thumbnail ${
						elem.isExtra ? 'extra' : ''
					}" data-id="${elem.passcode}" src="${
						revealed ? elem.image : CARD_BACK
					}"></img>`
				);
				newCard.addEventListener('mouseover', () => {
					document.querySelector('#preview').src = newCard.src;
				});
				var cardRevealed = revealed;
				newCard.addEventListener('click', () => {
					if (!cardRevealed) {
						newCard.classList.add('flip1');
						animateEnd = () => {
							if (newCard.classList.contains('flip1')) {
								newCard.classList.remove('flip1');
								newCard.classList.add('flip2');
								newCard.src = elem.image;
								cardRevealed = true;
							} else if (newCard.classList.contains('flip2')) {
								newCard.classList.remove('flip2');
								newCard.removeEventListener('transitionend', animateEnd);
							}
						};
						newCard.addEventListener('transitionend', animateEnd);
					} else {
						if (newCard.classList.contains('selected')) {
							newCard.classList.remove('selected');
						} else {
							const isExtra = newCard.classList.contains('extra');
							const totalSelected = document.querySelectorAll(
								`.selected${isExtra ? '.extra' : ''}`
							).length;
							if (
								(!isExtra && totalSelected < 60) ||
								(isExtra && totalSelected < 15)
							) {
								newCard.classList.add('selected');
							}
						}
					}
				});
				const main = document.querySelector('#main');
				main.appendChild(newCard);
				main.scrollTo(0, main.scrollHeight);
			});
		};

		document.querySelector('#add').addEventListener('click', () => {
			addCards(false);
		});

		document.querySelector('#add-shown').addEventListener('click', () => {
			addCards(true);
		});

		document.querySelector('#sort').addEventListener('click', () => {
			const main = document.querySelector('#main');
			const items = main.childNodes;
			let itemsArr = [];
			for (var i in items) {
				if (items[i].nodeType == 1) {
					// get rid of the whitespace text nodes
					itemsArr.push(items[i]);
				}
			}

			itemsArr.sort(function (a, b) {
				const cardBackCompare =
					(a.src == CARD_BACK ? 1 : 0) - (b.src == CARD_BACK ? 1 : 0);
				let selectedCompare =
					(a.classList.contains('selected') ? -1 : 0) -
					(b.classList.contains('selected') ? -1 : 0);
				if (selectedCompare == 0) {
					selectedCompare =
						(a.classList.contains('extra') ? 1 : 0) -
						(b.classList.contains('extra') ? 1 : 0);
				}
				return (
					selectedCompare * 100 +
					cardBackCompare * 10 +
					(a.src == b.src ? 0 : a.src > b.src ? 1 : -1)
				);
			});

			for (i = 0; i < itemsArr.length; ++i) {
				main.appendChild(itemsArr[i]);
			}
		});

		document.querySelector('#export').addEventListener('click', () => {
			deck = '#main\n';
			document.querySelectorAll('.selected:not(.extra)').forEach((elem) => {
				deck += elem.getAttribute('data-id') + '\n';
			});
			deck += '#extra\n';
			document.querySelectorAll('.selected.extra').forEach((elem) => {
				deck += elem.getAttribute('data-id') + '\n';
			});
			deck += '!side\n';
			download('sealedplay.ydk', deck);
		});

		document.querySelector('#select-all').addEventListener('click', () => {
			document
				.querySelectorAll('.card-thumbnail:not(.selected)')
				.forEach((elem) => {
					elem.click();
				});
		});
	};

	popupHandler(win.document);
};

main();

/*
Bookmarklet:

javascript:(function()%7Blet%20main%20%3D%20async%20()%20%3D%3E%20%7Blet%20retrieveCardsWithRarity%20%3D%20async%20()%20%3D%3E%20%7Bconst%20tables%20%3D%20Array.prototype.slice.call(document.querySelectorAll('table'))%3Bconst%20cardLists%20%3D%20tables.filter((table)%20%3D%3E%20%7Bconst%20parentTitle%20%3D%20table.parentElement.title.trim()%3Bif%20(parentTitle%20!%3D%20'English'%20%26%26%20parentTitle%20!%3D%20'North%20American')%20%7Breturn%20false%3B%7Dconst%20colNames%20%3D%20new%20Set(Array.prototype.slice.call(table.querySelectorAll('thead%20th')).map((th)%20%3D%3E%20th.innerText.trim().toLowerCase()))%3Breturn%20((colNames.has('card%20number')%20%7C%7C%20colNames.has('set%20number'))%20%26%26colNames.has('rarity')%20%26%26colNames.has('category'))%3B%7D)%3BcardLists.sort((a%2C%20b)%20%3D%3E%20%7Bscore%20%3D%20(x)%20%3D%3E%20%7Bswitch%20(x.parentElement.title.trim())%20%7Bcase%20'English'%3Areturn%200%3Bcase%20'North%20American'%3Areturn%201%3Bdefault%3Areturn%202%3B%7D%7D%3Breturn%20score(a)%20-%20score(b)%3B%7D)%3Bconst%20cardList%20%3D%20cardLists%5B0%5D%3Bconst%20colNames%20%3D%20Array.prototype.slice.call(cardList.querySelectorAll('thead%20th')).map((th)%20%3D%3E%20th.innerText.trim().toLowerCase())%3Blet%20cardNumberIndex%20%3D%20colNames.indexOf('card%20number')%3Bif%20(cardNumberIndex%20%3D%3D%20-1)%20%7BcardNumberIndex%20%3D%20colNames.indexOf('set%20number')%3B%7Dconst%20rarityIndex%20%3D%20colNames.indexOf('rarity')%3Bconst%20categoryIndex%20%3D%20colNames.indexOf('category')%3Bconst%20cards%20%3D%20%5B%5D%3Bconst%20dataFetcherPromises%20%3D%20Array.prototype.slice.call(cardList.querySelectorAll('tbody%20tr')).map((row)%20%3D%3E%20%7Bconst%20rowText%20%3D%20Array.prototype.slice.call(row.querySelectorAll('td')).map((x)%20%3D%3E%20x.innerText)%3Bconst%20cardNumber%20%3D%20rowText%5BcardNumberIndex%5D%3Bconst%20rarity%20%3D%20rowText%5BrarityIndex%5D%3Bconst%20category%20%3D%20rowText%5BcategoryIndex%5D.toLowerCase()%3Breturn%20fetch(%60https%3A%2F%2Fyugioh.fandom.com%2Fwiki%2F%24%7BcardNumber%7D%60).then((res)%20%3D%3E%20res.text()).then((html)%20%3D%3E%20%7Bconsole.log(cardNumber)%3Bconst%20image%20%3D%20html.match(%2F%22cardtable-cardimage%22.%2B%3Cimg%5B%5E%3E%5D%2Bsrc%5Cs*%3D%5Cs*%22(%5B%5E%22%5D%2B)%22%2F)%5B1%5D%3Bconst%20title%20%3D%20html.match(%2F%3Ctitle%3E(%5B%5E%3C%5D%2B)%3C%5C%2Ftitle%3E%2F)%5B1%5D.split('%7C')%5B0%5D.trim()%3Bswitch%20(title)%20%7B%7Dconst%20passcode%20%3D%20(()%20%3D%3E%20%7Bswitch%20(title)%20%7Bcase%20'Obelisk%20the%20Tormentor'%3Areturn%20'10000001'%3Bcase%20'Slifer%20the%20Sky%20Dragon'%3Areturn%20'10000021'%3Bcase%20'The%20Winged%20Dragon%20of%20Ra'%3Areturn%20'10000011'%3Bdefault%3Areturn%20html.match(%2F%3Ca%5Cs*href%5Cs*%5B%5E%3E%5D%2Btitle%5Cs*%3D%5Cs*%22(%5Cd%7B8%7D)%2F)%5B1%5D%3B%7D%7D)()%3Bcards.push(%7BcardNumber%2Crarity%2CisExtra%3A%20!!category.match(%2F(%3F%3Afusion%7Csynchro%7Cxyz%7Clink)%2F)%2Cimage%2Cpasscode%2C%7D)%3B%7D)%3B%7D)%3Breturn%20Promise.all(dataFetcherPromises).then(()%20%3D%3E%20%7Breturn%20cards.sort((a%2C%20b)%20%3D%3E%20a.cardNumber.localeCompare(b.cardNumber))%3B%7D)%3B%7D%3Blet%20cards%20%3D%20await%20retrieveCardsWithRarity()%3Blet%20cardsByRarity%20%3D%20%7B%7D%3Bcards.forEach((card)%20%3D%3E%20%7Bif%20(!(card.rarity%20in%20cardsByRarity))%20%7BcardsByRarity%5Bcard.rarity%5D%20%3D%20%5B%5D%3B%7DcardsByRarity%5Bcard.rarity%5D.push(card)%3B%7D)%3Bconsole.log(cards)%3Blet%20popupHtml%20%3D%20%60%3Cstyle%20type%3D%22text%2Fcss%22%3E.column%20%7Bfloat%3A%20left%3B%7D.left%20%7Bwidth%3A%2075%25%3B%7D%23main%20%7Boverflow-y%3A%20scroll%3Bheight%3A%2095%25%3B%7D.right%20%7Bwidth%3A%2025%25%3B%7D.card-thumbnail%20%7Bwidth%3A%20144px%3Bmargin%3A%208px%3B%7D.card-thumbnail.flip1%20%7Btransition%3A%20.5s%20ease-in-out%3Btransform%3A%20scale(0%2C%201)%3B%7D.card-thumbnail.flip2%20%7Btransition%3A%20.5s%20ease-in-out%3Btransform%3A%20scale(1%2C%201)%3B%7D.selected.extra%20%7Boutline%3A%204px%20solid%20blue%3B%7D.selected%20%7Boutline%3A%204px%20solid%20red%3B%7D%3C%2Fstyle%3E%3Cdiv%20class%3D%22row%22%3E%3Cdiv%20class%3D%22column%20left%22%20%3E%3Cbutton%20id%3D%22add%22%3EOpen%20Booster%3C%2Fbutton%3E%3Cbutton%20id%3D%22add-shown%22%3EOpen%20Revealed%20Booster%3C%2Fbutton%3E%3Cbutton%20id%3D%22sort%22%3ESort%3C%2Fbutton%3E%3Cbutton%20id%3D%22export%22%3EExport%3C%2Fbutton%3E%3Cbutton%20id%3D%22select-all%22%3EClick%20All%3C%2Fbutton%3E%3Cbr%20%2F%3E%3Cdiv%20id%3D%22main%22%3E%3C%2Fdiv%3E%3C%2Fdiv%3E%3Cdiv%20class%3D%22column%20right%22%3E%3Cimg%20id%3D%22preview%22%20width%3D%22100%25%22%3E%3C%2Fimg%3E%3C%2Fdiv%3E%3C%2Fdiv%3E%60%3Blet%20createSelector%20%3D%20()%20%3D%3E%20%7Bconst%20randomElem%20%3D%20(arr)%20%3D%3E%20%7Breturn%20arr%5BMath.floor(Math.random()%20*%20arr.length)%5D%3B%7D%3Bconst%20url%20%3D%20%5Blocation.protocol%2C%20'%2F%2F'%2C%20location.host%2C%20location.pathname%5D.join('').replace('https%3A%2F%2Fyugioh.fandom.com%2Fwiki%2F'%2C%20'')%3Bswitch%20(url)%20%7Bcase%20'Battle_Pack%3A_Epic_Dawn'%3Areturn%20()%20%3D%3E%20%7Blet%20slot1%20%3D%20cards.slice(0%2C%2055)%3Blet%20slot2%20%3D%20cards.slice(55%2C%20110)%3Blet%20slot3%20%3D%20cards.slice(110%2C%20170)%3Blet%20slot4%20%3D%20cards.slice(170)%3Breturn%20%5BrandomElem(slot1)%2CrandomElem(slot2)%2CrandomElem(slot3)%2CrandomElem(slot4)%2CrandomElem(cards)%2C%5D%3B%7D%3Bcase%20'Battle_Pack_2%3A_War_of_the_Giants'%3Areturn%20()%20%3D%3E%20%7Blet%20commons%20%3D%20cardsByRarity%5B'Common%5CnMosaic%20Rare'%5D%3Blet%20rares%20%3D%20cardsByRarity%5B'Rare%5CnMosaic%20Rare'%5D%3Breturn%20%5BrandomElem(rares)%2CrandomElem(commons)%2CrandomElem(commons)%2CrandomElem(commons)%2CrandomElem(cards)%2C%5D%3B%7D%3Bdefault%3Areturn%20()%20%3D%3E%20%7Blet%20commons%20%3D%20cardsByRarity%5B'Common'%5D%3Blet%20rares%20%3D%20cardsByRarity%5B'Rare'%5D%3Blet%20others%20%3D%20%5B%5D%3Bfor%20(let%20key%20in%20cardsByRarity)%20%7Bif%20(key%20%3D%3D%20'Common'%20%7C%7C%20key%20%3D%3D%20'Rare')%20%7Bcontinue%3B%7Dothers.push(...cardsByRarity%5Bkey%5D)%3B%7Dreturn%20%5BrandomElem(commons)%2CrandomElem(commons)%2CrandomElem(commons)%2CrandomElem(commons)%2CrandomElem(commons)%2CrandomElem(commons)%2CrandomElem(commons)%2CrandomElem(rares)%2CrandomElem(others)%2C%5D%3B%7D%3B%7D%7D%3Blet%20selector%20%3D%20createSelector()%3Blet%20win%20%3D%20window.open(''%2C'Sealed%20Play%20Card%20Selector'%2C'toolbar%3Dno%2Clocation%3Dno%2Cdirectories%3Dno%2Cstatus%3Dno%2Cmenubar%3Dno%2Cscrollbars%3Dyes%2Cresizable%3Dyes')%3Bwin.document.body.innerHTML%20%3D%20popupHtml%3Blet%20popupHandler%20%3D%20(document)%20%3D%3E%20%7Bconst%20CARD_BACK%20%3D'https%3A%2F%2Fvignette.wikia.nocookie.net%2Fyugioh%2Fimages%2Fe%2Fe5%2FBack-EN.png%2Frevision%2Flatest%3Fcb%3D20100726082133'%3Bconst%20download%20%3D%20(filename%2C%20text)%20%3D%3E%20%7Blet%20element%20%3D%20document.createElement('a')%3Belement.setAttribute('href'%2C'data%3Atext%2Fplain%3Bcharset%3Dutf-8%2C'%20%2B%20encodeURIComponent(text))%3Belement.setAttribute('download'%2C%20filename)%3Belement.style.display%20%3D%20'none'%3Bdocument.body.appendChild(element)%3Belement.click()%3Bdocument.body.removeChild(element)%3B%7D%3Bconst%20createElement%20%3D%20(html)%20%3D%3E%20%7Bconst%20div%20%3D%20document.createElement('div')%3Bdiv.innerHTML%20%3D%20html.trim()%3Breturn%20div.firstChild%3B%7D%3Bconst%20addCards%20%3D%20(revealed)%20%3D%3E%20%7Blet%20newCards%20%3D%20selector()%3BnewCards.forEach((elem)%20%3D%3E%20%7Bconst%20newCard%20%3D%20createElement(%60%3Cimg%20class%3D%22card-thumbnail%20%24%7Belem.isExtra%20%3F%20'extra'%20%3A%20''%7D%22%20data-id%3D%22%24%7Belem.passcode%7D%22%20src%3D%22%24%7Brevealed%20%3F%20elem.image%20%3A%20CARD_BACK%7D%22%3E%3C%2Fimg%3E%60)%3BnewCard.addEventListener('mouseover'%2C%20()%20%3D%3E%20%7Bdocument.querySelector('%23preview').src%20%3D%20newCard.src%3B%7D)%3Bvar%20cardRevealed%20%3D%20revealed%3BnewCard.addEventListener('click'%2C%20()%20%3D%3E%20%7Bif%20(!cardRevealed)%20%7BnewCard.classList.add('flip1')%3BanimateEnd%20%3D%20()%20%3D%3E%20%7Bif%20(newCard.classList.contains('flip1'))%20%7BnewCard.classList.remove('flip1')%3BnewCard.classList.add('flip2')%3BnewCard.src%20%3D%20elem.image%3BcardRevealed%20%3D%20true%3B%7D%20else%20if%20(newCard.classList.contains('flip2'))%20%7BnewCard.classList.remove('flip2')%3BnewCard.removeEventListener('transitionend'%2C%20animateEnd)%3B%7D%7D%3BnewCard.addEventListener('transitionend'%2C%20animateEnd)%3B%7D%20else%20%7Bif%20(newCard.classList.contains('selected'))%20%7BnewCard.classList.remove('selected')%3B%7D%20else%20%7Bconst%20isExtra%20%3D%20newCard.classList.contains('extra')%3Bconst%20totalSelected%20%3D%20document.querySelectorAll(%60.selected%24%7BisExtra%20%3F%20'.extra'%20%3A%20''%7D%60).length%3Bif%20((!isExtra%20%26%26%20totalSelected%20%3C%2060)%20%7C%7C(isExtra%20%26%26%20totalSelected%20%3C%2015))%20%7BnewCard.classList.add('selected')%3B%7D%7D%7D%7D)%3Bconst%20main%20%3D%20document.querySelector('%23main')%3Bmain.appendChild(newCard)%3Bmain.scrollTo(0%2C%20main.scrollHeight)%3B%7D)%3B%7D%3Bdocument.querySelector('%23add').addEventListener('click'%2C%20()%20%3D%3E%20%7BaddCards(false)%3B%7D)%3Bdocument.querySelector('%23add-shown').addEventListener('click'%2C%20()%20%3D%3E%20%7BaddCards(true)%3B%7D)%3Bdocument.querySelector('%23sort').addEventListener('click'%2C%20()%20%3D%3E%20%7Bconst%20main%20%3D%20document.querySelector('%23main')%3Bconst%20items%20%3D%20main.childNodes%3Blet%20itemsArr%20%3D%20%5B%5D%3Bfor%20(var%20i%20in%20items)%20%7Bif%20(items%5Bi%5D.nodeType%20%3D%3D%201)%20%7B%2F%2F%20get%20rid%20of%20the%20whitespace%20text%20nodesitemsArr.push(items%5Bi%5D)%3B%7D%7DitemsArr.sort(function%20(a%2C%20b)%20%7Bconst%20cardBackCompare%20%3D(a.src%20%3D%3D%20CARD_BACK%20%3F%201%20%3A%200)%20-%20(b.src%20%3D%3D%20CARD_BACK%20%3F%201%20%3A%200)%3Blet%20selectedCompare%20%3D(a.classList.contains('selected')%20%3F%20-1%20%3A%200)%20-(b.classList.contains('selected')%20%3F%20-1%20%3A%200)%3Bif%20(selectedCompare%20%3D%3D%200)%20%7BselectedCompare%20%3D(a.classList.contains('extra')%20%3F%201%20%3A%200)%20-(b.classList.contains('extra')%20%3F%201%20%3A%200)%3B%7Dreturn%20(selectedCompare%20*%20100%20%2BcardBackCompare%20*%2010%20%2B(a.src%20%3D%3D%20b.src%20%3F%200%20%3A%20a.src%20%3E%20b.src%20%3F%201%20%3A%20-1))%3B%7D)%3Bfor%20(i%20%3D%200%3B%20i%20%3C%20itemsArr.length%3B%20%2B%2Bi)%20%7Bmain.appendChild(itemsArr%5Bi%5D)%3B%7D%7D)%3Bdocument.querySelector('%23export').addEventListener('click'%2C%20()%20%3D%3E%20%7Bdeck%20%3D%20'%23main%5Cn'%3Bdocument.querySelectorAll('.selected%3Anot(.extra)').forEach((elem)%20%3D%3E%20%7Bdeck%20%2B%3D%20elem.getAttribute('data-id')%20%2B%20'%5Cn'%3B%7D)%3Bdeck%20%2B%3D%20'%23extra%5Cn'%3Bdocument.querySelectorAll('.selected.extra').forEach((elem)%20%3D%3E%20%7Bdeck%20%2B%3D%20elem.getAttribute('data-id')%20%2B%20'%5Cn'%3B%7D)%3Bdeck%20%2B%3D%20'!side%5Cn'%3Bdownload('sealedplay.ydk'%2C%20deck)%3B%7D)%3Bdocument.querySelector('%23select-all').addEventListener('click'%2C%20()%20%3D%3E%20%7Bdocument.querySelectorAll('.card-thumbnail%3Anot(.selected)').forEach((elem)%20%3D%3E%20%7Belem.click()%3B%7D)%3B%7D)%3B%7D%3BpopupHandler(win.document)%3B%7D%3Bmain()%3B%2F*https%3A%2F%2Fobfuscator.io%2Fconst%20_0x55d6%3D%5B'join'%2C'.selected'%2C'626958HhirAb'%2C'all'%2C'div'%2C'%23extra%5Cx0a'%2C'%23select-all'%2C'scrollHeight'%2C'match'%2C'log'%2C'call'%2C'slice'%2C'removeEventListener'%2C'indexOf'%2C'classList'%2C'has'%2C'https%3A%2F%2Fyugioh.fandom.com%2Fwiki%2F'%2C'selected'%2C'1ByAHyk'%2C'736469nYQLfb'%2C'appendChild'%2C'thead%5Cx20th'%2C'passcode'%2C'host'%2C'protocol'%2C'contains'%2C'remove'%2C'then'%2C'mouseover'%2C'getAttribute'%2C'961053jDMYdQ'%2C'innerText'%2C'2BTAwTr'%2C'category'%2C'text'%2C'Rare'%2C'!side%5Cx0a'%2C'%23add'%2C'%5Cx22%5Cx20src%3D%5Cx22'%2C'369167tOIgTC'%2C'Common'%2C'nodeType'%2C'childNodes'%2C'display'%2C'tbody%5Cx20tr'%2C'length'%2C'trim'%2C'body'%2C'flip2'%2C'sort'%2C'set%5Cx20number'%2C'innerHTML'%2C'1144127ojVmaa'%2C'toLowerCase'%2C'%23main'%2C'969997mHVBDQ'%2C'createElement'%2C'click'%2C'querySelector'%2C'title'%2C'localeCompare'%2C'transitionend'%2C'add'%2C'document'%2C'.selected.extra'%2C'replace'%2C'setAttribute'%2C'none'%2C'map'%2C'download'%2C'extra'%2C'scrollTo'%2C'forEach'%2C'push'%2C'firstChild'%2C'.selected%3Anot(.extra)'%2C'sealedplay.ydk'%2C'href'%2C'image'%2C'%23export'%2C'data-id'%2C'filter'%2C'rarity'%2C'cardNumber'%2C'querySelectorAll'%2C'open'%2C'addEventListener'%2C'src'%2C'Sealed%5Cx20Play%5Cx20Card%5Cx20Selector'%2C'prototype'%2C'parentElement'%2C'1147563VggdhF'%2C'card%5Cx20number'%2C'https%3A%2F%2Fvignette.wikia.nocookie.net%2Fyugioh%2Fimages%2Fe%2Fe5%2FBack-EN.png%2Frevision%2Flatest%3Fcb%3D20100726082133'%2C'%5Cx0a%3Cstyle%5Cx20type%3D%5Cx22text%2Fcss%5Cx22%3E%5Cx0a%5Cx09.column%5Cx20%7B%5Cx0a%5Cx09%5Cx20%5Cx20float%3A%5Cx20left%3B%5Cx0a%5Cx09%7D%5Cx0a%5Cx0a%5Cx09.left%5Cx20%7B%5Cx0a%5Cx09%5Cx20%5Cx20width%3A%5Cx2075%25%3B%5Cx0a%5Cx09%7D%5Cx0a%5Cx0a%5Cx09%23main%5Cx20%7B%5Cx0a%5Cx09%5Cx09overflow-y%3A%5Cx20scroll%3B%5Cx0a%5Cx09%5Cx20%5Cx20height%3A%5Cx2095%25%3B%5Cx0a%5Cx09%7D%5Cx0a%5Cx0a%5Cx09.right%5Cx20%7B%5Cx0a%5Cx09%5Cx20%5Cx20width%3A%5Cx2025%25%3B%5Cx0a%5Cx09%7D%5Cx0a%5Cx0a%5Cx09.card-thumbnail%5Cx20%7B%5Cx0a%5Cx09%5Cx09width%3A%5Cx20144px%3B%5Cx0a%5Cx09%5Cx09margin%3A%5Cx208px%3B%5Cx0a%5Cx09%7D%5Cx0a%5Cx0a%5Cx09.card-thumbnail.flip1%5Cx20%7B%5Cx0a%5Cx09%5Cx09transition%3A%5Cx20.5s%5Cx20ease-in-out%3B%5Cx0a%5Cx09%5Cx09transform%3A%5Cx20scale(0%2C%5Cx201)%3B%5Cx0a%5Cx09%7D%5Cx0a%5Cx0a%5Cx09.card-thumbnail.flip2%5Cx20%7B%5Cx0a%5Cx09%5Cx09transition%3A%5Cx20.5s%5Cx20ease-in-out%3B%5Cx0a%5Cx09%5Cx09transform%3A%5Cx20scale(1%2C%5Cx201)%3B%5Cx0a%5Cx09%7D%5Cx0a%5Cx0a%5Cx09.selected.extra%5Cx20%7B%5Cx0a%5Cx09%5Cx09outline%3A%5Cx204px%5Cx20solid%5Cx20blue%3B%5Cx0a%5Cx09%7D%5Cx0a%5Cx0a%5Cx09.selected%5Cx20%7B%5Cx0a%5Cx09%5Cx09outline%3A%5Cx204px%5Cx20solid%5Cx20red%3B%5Cx0a%5Cx09%7D%5Cx0a%3C%2Fstyle%3E%5Cx0a%3Cdiv%5Cx20class%3D%5Cx22row%5Cx22%3E%5Cx0a%5Cx09%3Cdiv%5Cx20class%3D%5Cx22column%5Cx20left%5Cx22%5Cx20%3E%5Cx0a%5Cx09%5Cx09%3Cbutton%5Cx20id%3D%5Cx22add%5Cx22%3E%5Cx0a%5Cx09%5Cx09%5Cx09Open%5Cx20Booster%5Cx0a%5Cx09%5Cx09%3C%2Fbutton%3E%5Cx0a%5Cx09%5Cx09%3Cbutton%5Cx20id%3D%5Cx22add-shown%5Cx22%3E%5Cx0a%5Cx09%5Cx09%5Cx09Open%5Cx20Revealed%5Cx20Booster%5Cx0a%5Cx09%5Cx09%3C%2Fbutton%3E%5Cx0a%5Cx09%5Cx09%3Cbutton%5Cx20id%3D%5Cx22sort%5Cx22%3E%5Cx0a%5Cx09%5Cx09%5Cx09Sort%5Cx0a%5Cx09%5Cx09%3C%2Fbutton%3E%5Cx0a%5Cx09%5Cx09%3Cbutton%5Cx20id%3D%5Cx22export%5Cx22%3E%5Cx0a%5Cx09%5Cx09%5Cx09Export%5Cx0a%5Cx09%5Cx09%3C%2Fbutton%3E%5Cx0a%5Cx09%5Cx09%3Cbutton%5Cx20id%3D%5Cx22select-all%5Cx22%3E%5Cx0a%5Cx09%5Cx09%5Cx09Click%5Cx20All%5Cx0a%5Cx09%5Cx09%3C%2Fbutton%3E%5Cx0a%5Cx09%5Cx09%3Cbr%5Cx20%2F%3E%5Cx0a%5Cx09%5Cx09%3Cdiv%5Cx20id%3D%5Cx22main%5Cx22%3E%5Cx0a%5Cx09%5Cx09%3C%2Fdiv%3E%5Cx0a%5Cx09%3C%2Fdiv%3E%5Cx0a%5Cx09%3Cdiv%5Cx20class%3D%5Cx22column%5Cx20right%5Cx22%3E%5Cx0a%5Cx09%5Cx09%3Cimg%5Cx20id%3D%5Cx22preview%5Cx22%5Cx20width%3D%5Cx22100%25%5Cx22%3E%3C%2Fimg%3E%5Cx0a%5Cx09%3C%2Fdiv%3E%5Cx0a%3C%2Fdiv%3E'%2C'flip1'%2C'table'%2C'floor'%2C'English'%5D%3Bconst%20_0x37e5%3Dfunction(_0x231b09%2C_0x1dc87f)%7B_0x231b09%3D_0x231b09-0x1e9%3Blet%20_0x55d64b%3D_0x55d6%5B_0x231b09%5D%3Breturn%20_0x55d64b%3B%7D%3B(function(_0x49e8a8%2C_0xec053f)%7Bconst%20_0x50b49d%3D_0x37e5%3Bwhile(!!%5B%5D)%7Btry%7Bconst%20_0x186f98%3D-parseInt(_0x50b49d(0x21d))%2B-parseInt(_0x50b49d(0x202))%2B-parseInt(_0x50b49d(0x22a))*-parseInt(_0x50b49d(0x231))%2B-parseInt(_0x50b49d(0x241))%2B-parseInt(_0x50b49d(0x228))*-parseInt(_0x50b49d(0x21c))%2BparseInt(_0x50b49d(0x20c))%2BparseInt(_0x50b49d(0x23e))%3Bif(_0x186f98%3D%3D%3D_0xec053f)break%3Belse%20_0x49e8a8%5B'push'%5D(_0x49e8a8%5B'shift'%5D())%3B%7Dcatch(_0x40d0a5)%7B_0x49e8a8%5B'push'%5D(_0x49e8a8%5B'shift'%5D())%3B%7D%7D%7D(_0x55d6%2C0x967fb))%3Blet%20main%3Dasync()%3D%3E%7Bconst%20_0x3768c3%3D_0x37e5%3Blet%20_0x599ca3%3Dasync()%3D%3E%7Bconst%20_0x2e5f77%3D_0x37e5%2C_0x4a2e7a%3DArray%5B_0x2e5f77(0x200)%5D%5B_0x2e5f77(0x215)%5D%5B'call'%5D(document%5B_0x2e5f77(0x1fb)%5D(_0x2e5f77(0x207)))%2C_0x38bbe2%3D_0x4a2e7a%5B_0x2e5f77(0x1f8)%5D(_0x4fd14b%3D%3E%7Bconst%20_0x5b8537%3D_0x2e5f77%2C_0x2d3cd0%3D_0x4fd14b%5B_0x5b8537(0x201)%5D%5B_0x5b8537(0x245)%5D%5B_0x5b8537(0x238)%5D()%3Bif(_0x2d3cd0!%3D'English'%26%26_0x2d3cd0!%3D'North%5Cx20American')return!%5B%5D%3Bconst%20_0x54c3d1%3Dnew%20Set(Array%5B_0x5b8537(0x200)%5D%5B_0x5b8537(0x215)%5D%5B_0x5b8537(0x214)%5D(_0x4fd14b%5B_0x5b8537(0x1fb)%5D(_0x5b8537(0x21f)))%5B_0x5b8537(0x1eb)%5D(_0x423dc3%3D%3E_0x423dc3%5B_0x5b8537(0x229)%5D%5B_0x5b8537(0x238)%5D()%5B'toLowerCase'%5D()))%3Breturn(_0x54c3d1%5B_0x5b8537(0x219)%5D('card%5Cx20number')%7C%7C_0x54c3d1%5B'has'%5D('set%5Cx20number'))%26%26_0x54c3d1%5B_0x5b8537(0x219)%5D(_0x5b8537(0x1f9))%26%26_0x54c3d1%5B_0x5b8537(0x219)%5D(_0x5b8537(0x22b))%3B%7D)%3B_0x38bbe2%5B_0x2e5f77(0x23b)%5D((_0x461082%2C_0x4ff688)%3D%3E%7Breturn%20score%3D_0x604b18%3D%3E%7Bconst%20_0x4cf754%3D_0x37e5%3Bswitch(_0x604b18%5B'parentElement'%5D%5B_0x4cf754(0x245)%5D%5B_0x4cf754(0x238)%5D())%7Bcase%20_0x4cf754(0x209)%3Areturn%200x0%3Bcase'North%5Cx20American'%3Areturn%200x1%3Bdefault%3Areturn%200x2%3B%7D%7D%2Cscore(_0x461082)-score(_0x4ff688)%3B%7D)%3Bconst%20_0x39ce97%3D_0x38bbe2%5B0x0%5D%2C_0x2684ab%3DArray%5B'prototype'%5D%5B'slice'%5D%5B'call'%5D(_0x39ce97%5B_0x2e5f77(0x1fb)%5D(_0x2e5f77(0x21f)))%5B_0x2e5f77(0x1eb)%5D(_0x2dc0ec%3D%3E_0x2dc0ec%5B_0x2e5f77(0x229)%5D%5B_0x2e5f77(0x238)%5D()%5B_0x2e5f77(0x23f)%5D())%3Blet%20_0x559a2f%3D_0x2684ab%5B'indexOf'%5D(_0x2e5f77(0x203))%3B_0x559a2f%3D%3D-0x1%26%26(_0x559a2f%3D_0x2684ab%5B_0x2e5f77(0x217)%5D(_0x2e5f77(0x23c)))%3Bconst%20_0x101d7e%3D_0x2684ab%5B_0x2e5f77(0x217)%5D(_0x2e5f77(0x1f9))%2C_0x11dcfc%3D_0x2684ab%5B'indexOf'%5D(_0x2e5f77(0x22b))%2C_0x135aec%3D%5B%5D%2C_0x5b9184%3DArray%5B'prototype'%5D%5B_0x2e5f77(0x215)%5D%5B_0x2e5f77(0x214)%5D(_0x39ce97%5B_0x2e5f77(0x1fb)%5D(_0x2e5f77(0x236)))%5B_0x2e5f77(0x1eb)%5D(_0x1f0f76%3D%3E%7Bconst%20_0x5d4a4f%3D_0x2e5f77%2C_0x15de16%3DArray%5B'prototype'%5D%5B_0x5d4a4f(0x215)%5D%5B_0x5d4a4f(0x214)%5D(_0x1f0f76%5B_0x5d4a4f(0x1fb)%5D('td'))%5B_0x5d4a4f(0x1eb)%5D(_0x9991bd%3D%3E_0x9991bd%5B'innerText'%5D)%2C_0x962099%3D_0x15de16%5B_0x559a2f%5D%2C_0x2ec30e%3D_0x15de16%5B_0x101d7e%5D%2C_0x22f164%3D_0x15de16%5B_0x11dcfc%5D%5B_0x5d4a4f(0x23f)%5D()%3Breturn%20fetch('https%3A%2F%2Fyugioh.fandom.com%2Fwiki%2F'%2B_0x962099)%5B_0x5d4a4f(0x225)%5D(_0xa112b0%3D%3E_0xa112b0%5B_0x5d4a4f(0x22c)%5D())%5B'then'%5D(_0x166283%3D%3E%7Bconst%20_0x12062e%3D_0x5d4a4f%2C_0x5cfee1%3D_0x166283%5B_0x12062e(0x212)%5D(%2F%22cardtable-cardimage%22.%2B%3Cimg%5B%5E%3E%5D%2Bsrc%5Cs*%3D%5Cs*%22(%5B%5E%22%5D%2B)%22%2F)%5B0x1%5D%2C_0x580d37%3D_0x166283%5B'match'%5D(%2F%3Ca%5Cs*href%5Cs*%5B%5E%3E%5D%2Btitle%5Cs*%3D%5Cs*%22(%5Cd%7B8%7D)%2F)%5B0x1%5D%3B_0x135aec%5B_0x12062e(0x1f0)%5D(%7B'cardNumber'%3A_0x962099%2C'rarity'%3A_0x2ec30e%2C'isExtra'%3A!!_0x22f164%5B_0x12062e(0x212)%5D(%2F(%3F%3Afusion%7Csynchro%7Cxyz%7Clink)%2F)%2C'image'%3A_0x5cfee1%2C'passcode'%3A_0x580d37%7D)%3B%7D)%3B%7D)%3Breturn%20Promise%5B_0x2e5f77(0x20d)%5D(_0x5b9184)%5B'then'%5D(()%3D%3E%7Bconst%20_0x407c77%3D_0x2e5f77%3Breturn%20_0x135aec%5B'sort'%5D((_0x304b3c%2C_0x35e375)%3D%3E_0x304b3c%5B_0x407c77(0x1fa)%5D%5B_0x407c77(0x246)%5D(_0x35e375%5B'cardNumber'%5D))%3B%7D)%3B%7D%2C_0x38c30e%3Dawait%20_0x599ca3()%2C_0x3f10af%3D%7B%7D%3B_0x38c30e%5B_0x3768c3(0x1ef)%5D(_0x4f9153%3D%3E%7Bconst%20_0x2ab156%3D_0x3768c3%3B!(_0x4f9153%5B_0x2ab156(0x1f9)%5Din%20_0x3f10af)%26%26(_0x3f10af%5B_0x4f9153%5B'rarity'%5D%5D%3D%5B%5D)%2C_0x3f10af%5B_0x4f9153%5B'rarity'%5D%5D%5B_0x2ab156(0x1f0)%5D(_0x4f9153)%3B%7D)%2Cconsole%5B_0x3768c3(0x213)%5D(_0x38c30e)%3Blet%20_0x2f0bfe%3D_0x3768c3(0x205)%2C_0x39b746%3D()%3D%3E%7Bconst%20_0x6441d%3D_0x3768c3%2C_0x26e998%3D_0x5d2f68%3D%3E%7Bconst%20_0x4ff911%3D_0x37e5%3Breturn%20_0x5d2f68%5BMath%5B_0x4ff911(0x208)%5D(Math%5B'random'%5D()*_0x5d2f68%5B_0x4ff911(0x237)%5D)%5D%3B%7D%2C_0x4abb06%3D%5Blocation%5B_0x6441d(0x222)%5D%2C'%2F%2F'%2Clocation%5B_0x6441d(0x221)%5D%2Clocation%5B'pathname'%5D%5D%5B_0x6441d(0x20a)%5D('')%5B_0x6441d(0x24b)%5D(_0x6441d(0x21a)%2C'')%3Bswitch(_0x4abb06)%7Bdefault%3Areturn()%3D%3E%7Bconst%20_0x1912ca%3D_0x6441d%3Blet%20_0x25b6f5%3D_0x3f10af%5B_0x1912ca(0x232)%5D%2C_0x1ca133%3D_0x3f10af%5B_0x1912ca(0x22d)%5D%2C_0xf63b64%3D%5B%5D%3Bfor(let%20_0x298b24%20in%20_0x3f10af)%7Bif(_0x298b24%3D%3D_0x1912ca(0x232)%7C%7C_0x298b24%3D%3D_0x1912ca(0x22d))continue%3B_0xf63b64%5B_0x1912ca(0x1f0)%5D(..._0x3f10af%5B_0x298b24%5D)%3B%7Dreturn%5B_0x26e998(_0x25b6f5)%2C_0x26e998(_0x25b6f5)%2C_0x26e998(_0x25b6f5)%2C_0x26e998(_0x25b6f5)%2C_0x26e998(_0x25b6f5)%2C_0x26e998(_0x25b6f5)%2C_0x26e998(_0x25b6f5)%2C_0x26e998(_0x1ca133)%2C_0x26e998(_0xf63b64)%5D%3B%7D%3B%7D%7D%2C_0x1c5f80%3D_0x39b746()%2C_0x3245e%3Dwindow%5B_0x3768c3(0x1fc)%5D(''%2C_0x3768c3(0x1ff)%2C'toolbar%3Dno%2Clocation%3Dno%2Cdirectories%3Dno%2Cstatus%3Dno%2Cmenubar%3Dno%2Cscrollbars%3Dyes%2Cresizable%3Dyes')%3B_0x3245e%5B_0x3768c3(0x249)%5D%5B'body'%5D%5B_0x3768c3(0x23d)%5D%3D_0x2f0bfe%3Blet%20_0x89f91f%3D_0x1c879a%3D%3E%7Bconst%20_0x5381a0%3D_0x3768c3%2C_0x2f4e4f%3D_0x5381a0(0x204)%2C_0x1aa790%3D(_0x2f1484%2C_0x479ceb)%3D%3E%7Bconst%20_0x59bd87%3D_0x5381a0%3Blet%20_0xe16421%3D_0x1c879a%5B_0x59bd87(0x242)%5D('a')%3B_0xe16421%5B_0x59bd87(0x1e9)%5D(_0x59bd87(0x1f4)%2C'data%3Atext%2Fplain%3Bcharset%3Dutf-8%2C'%2BencodeURIComponent(_0x479ceb))%2C_0xe16421%5B_0x59bd87(0x1e9)%5D(_0x59bd87(0x1ec)%2C_0x2f1484)%2C_0xe16421%5B'style'%5D%5B_0x59bd87(0x235)%5D%3D_0x59bd87(0x1ea)%2C_0x1c879a%5B_0x59bd87(0x239)%5D%5B_0x59bd87(0x21e)%5D(_0xe16421)%2C_0xe16421%5B_0x59bd87(0x243)%5D()%2C_0x1c879a%5B'body'%5D%5B'removeChild'%5D(_0xe16421)%3B%7D%2C_0x436faa%3D_0x37f45f%3D%3E%7Bconst%20_0x5c16bc%3D_0x5381a0%2C_0x32afcb%3D_0x1c879a%5B_0x5c16bc(0x242)%5D(_0x5c16bc(0x20e))%3Breturn%20_0x32afcb%5B_0x5c16bc(0x23d)%5D%3D_0x37f45f%5B'trim'%5D()%2C_0x32afcb%5B_0x5c16bc(0x1f1)%5D%3B%7D%2C_0x144758%3D_0x119502%3D%3E%7Bconst%20_0x341429%3D_0x5381a0%3Blet%20_0x391565%3D_0x1c5f80()%3B_0x391565%5B_0x341429(0x1ef)%5D(_0x12c272%3D%3E%7Bconst%20_0x2a1808%3D_0x341429%2C_0x2e302e%3D_0x436faa('%3Cimg%5Cx20class%3D%5Cx22card-thumbnail%5Cx20'%2B(_0x12c272%5B'isExtra'%5D%3F_0x2a1808(0x1ed)%3A'')%2B'%5Cx22%5Cx20data-id%3D%5Cx22'%2B_0x12c272%5B_0x2a1808(0x220)%5D%2B_0x2a1808(0x230)%2B(_0x119502%3F_0x12c272%5B_0x2a1808(0x1f5)%5D%3A_0x2f4e4f)%2B'%5Cx22%3E%3C%2Fimg%3E')%3B_0x2e302e%5B_0x2a1808(0x1fd)%5D(_0x2a1808(0x226)%2C()%3D%3E%7Bconst%20_0x2acd68%3D_0x2a1808%3B_0x1c879a%5B_0x2acd68(0x244)%5D('%23preview')%5B'src'%5D%3D_0x2e302e%5B'src'%5D%3B%7D)%3Bvar%20_0x39c491%3D_0x119502%3B_0x2e302e%5B_0x2a1808(0x1fd)%5D(_0x2a1808(0x243)%2C()%3D%3E%7Bconst%20_0x54736b%3D_0x2a1808%3Bif(!_0x39c491)_0x2e302e%5B_0x54736b(0x218)%5D%5B_0x54736b(0x248)%5D(_0x54736b(0x206))%2CanimateEnd%3D()%3D%3E%7Bconst%20_0xf55f69%3D_0x54736b%3Bif(_0x2e302e%5B'classList'%5D%5B_0xf55f69(0x223)%5D(_0xf55f69(0x206)))_0x2e302e%5B_0xf55f69(0x218)%5D%5B_0xf55f69(0x224)%5D(_0xf55f69(0x206))%2C_0x2e302e%5B_0xf55f69(0x218)%5D%5B_0xf55f69(0x248)%5D(_0xf55f69(0x23a))%2C_0x2e302e%5B_0xf55f69(0x1fe)%5D%3D_0x12c272%5B'image'%5D%2C_0x39c491%3D!!%5B%5D%3Belse%20_0x2e302e%5B_0xf55f69(0x218)%5D%5B'contains'%5D('flip2')%26%26(_0x2e302e%5B_0xf55f69(0x218)%5D%5B'remove'%5D(_0xf55f69(0x23a))%2C_0x2e302e%5B_0xf55f69(0x216)%5D(_0xf55f69(0x247)%2CanimateEnd))%3B%7D%2C_0x2e302e%5B_0x54736b(0x1fd)%5D('transitionend'%2CanimateEnd)%3Belse%7Bif(_0x2e302e%5B_0x54736b(0x218)%5D%5B_0x54736b(0x223)%5D('selected'))_0x2e302e%5B'classList'%5D%5B'remove'%5D('selected')%3Belse%7Bconst%20_0x20b94f%3D_0x2e302e%5B'classList'%5D%5B_0x54736b(0x223)%5D('extra')%2C_0x1915ed%3D_0x1c879a%5B'querySelectorAll'%5D(_0x54736b(0x20b)%2B(_0x20b94f%3F'.extra'%3A''))%5B_0x54736b(0x237)%5D%3B(!_0x20b94f%26%26_0x1915ed%3C0x3c%7C%7C_0x20b94f%26%26_0x1915ed%3C0xf)%26%26_0x2e302e%5B_0x54736b(0x218)%5D%5B_0x54736b(0x248)%5D('selected')%3B%7D%7D%7D)%3Bconst%20_0x56086d%3D_0x1c879a%5B_0x2a1808(0x244)%5D('%23main')%3B_0x56086d%5B'appendChild'%5D(_0x2e302e)%2C_0x56086d%5B_0x2a1808(0x1ee)%5D(0x0%2C_0x56086d%5B_0x2a1808(0x211)%5D)%3B%7D)%3B%7D%3B_0x1c879a%5B'querySelector'%5D(_0x5381a0(0x22f))%5B'addEventListener'%5D(_0x5381a0(0x243)%2C()%3D%3E%7B_0x144758(!%5B%5D)%3B%7D)%2C_0x1c879a%5B_0x5381a0(0x244)%5D('%23add-shown')%5B_0x5381a0(0x1fd)%5D(_0x5381a0(0x243)%2C()%3D%3E%7B_0x144758(!!%5B%5D)%3B%7D)%2C_0x1c879a%5B'querySelector'%5D('%23sort')%5B_0x5381a0(0x1fd)%5D(_0x5381a0(0x243)%2C()%3D%3E%7Bconst%20_0x482d69%3D_0x5381a0%2C_0x12dce3%3D_0x1c879a%5B_0x482d69(0x244)%5D(_0x482d69(0x240))%2C_0x1da7e1%3D_0x12dce3%5B_0x482d69(0x234)%5D%3Blet%20_0x18eee0%3D%5B%5D%3Bfor(var%20_0xd88647%20in%20_0x1da7e1)%7B_0x1da7e1%5B_0xd88647%5D%5B_0x482d69(0x233)%5D%3D%3D0x1%26%26_0x18eee0%5B_0x482d69(0x1f0)%5D(_0x1da7e1%5B_0xd88647%5D)%3B%7D_0x18eee0%5B_0x482d69(0x23b)%5D(function(_0x14687a%2C_0x3815c9)%7Bconst%20_0x51f64a%3D_0x482d69%2C_0x4e613c%3D(_0x14687a%5B_0x51f64a(0x1fe)%5D%3D%3D_0x2f4e4f%3F0x1%3A0x0)-(_0x3815c9%5B'src'%5D%3D%3D_0x2f4e4f%3F0x1%3A0x0)%3Blet%20_0x2a7aa0%3D(_0x14687a%5B_0x51f64a(0x218)%5D%5B_0x51f64a(0x223)%5D('selected')%3F-0x1%3A0x0)-(_0x3815c9%5B_0x51f64a(0x218)%5D%5B_0x51f64a(0x223)%5D(_0x51f64a(0x21b))%3F-0x1%3A0x0)%3Breturn%20_0x2a7aa0%3D%3D0x0%26%26(_0x2a7aa0%3D(_0x14687a%5B'classList'%5D%5B_0x51f64a(0x223)%5D(_0x51f64a(0x1ed))%3F0x1%3A0x0)-(_0x3815c9%5B_0x51f64a(0x218)%5D%5B'contains'%5D(_0x51f64a(0x1ed))%3F0x1%3A0x0))%2C_0x2a7aa0*0x64%2B_0x4e613c*0xa%2B(_0x14687a%5B_0x51f64a(0x1fe)%5D%3D%3D_0x3815c9%5B'src'%5D%3F0x0%3A_0x14687a%5B_0x51f64a(0x1fe)%5D%3E_0x3815c9%5B'src'%5D%3F0x1%3A-0x1)%3B%7D)%3Bfor(_0xd88647%3D0x0%3B_0xd88647%3C_0x18eee0%5B_0x482d69(0x237)%5D%3B%2B%2B_0xd88647)%7B_0x12dce3%5B_0x482d69(0x21e)%5D(_0x18eee0%5B_0xd88647%5D)%3B%7D%7D)%2C_0x1c879a%5B_0x5381a0(0x244)%5D(_0x5381a0(0x1f6))%5B'addEventListener'%5D('click'%2C()%3D%3E%7Bconst%20_0x566820%3D_0x5381a0%3Bdeck%3D'%23main%5Cx0a'%2C_0x1c879a%5B_0x566820(0x1fb)%5D(_0x566820(0x1f2))%5B_0x566820(0x1ef)%5D(_0x16aa4c%3D%3E%7Bconst%20_0x58ffbe%3D_0x566820%3Bdeck%2B%3D_0x16aa4c%5B_0x58ffbe(0x227)%5D(_0x58ffbe(0x1f7))%2B'%5Cx0a'%3B%7D)%2Cdeck%2B%3D_0x566820(0x20f)%2C_0x1c879a%5B'querySelectorAll'%5D(_0x566820(0x24a))%5B_0x566820(0x1ef)%5D(_0x4975ac%3D%3E%7Bconst%20_0x540b9f%3D_0x566820%3Bdeck%2B%3D_0x4975ac%5B_0x540b9f(0x227)%5D(_0x540b9f(0x1f7))%2B'%5Cx0a'%3B%7D)%2Cdeck%2B%3D_0x566820(0x22e)%2C_0x1aa790(_0x566820(0x1f3)%2Cdeck)%3B%7D)%2C_0x1c879a%5B'querySelector'%5D(_0x5381a0(0x210))%5B_0x5381a0(0x1fd)%5D(_0x5381a0(0x243)%2C()%3D%3E%7Bconst%20_0x2018f6%3D_0x5381a0%3B_0x1c879a%5B'querySelectorAll'%5D('.card-thumbnail%3Anot(.selected)')%5B_0x2018f6(0x1ef)%5D(_0x537095%3D%3E%7B_0x537095%5B'click'%5D()%3B%7D)%3B%7D)%3B%7D%3B_0x89f91f(_0x3245e%5B_0x3768c3(0x249)%5D)%3B%7D%3Bmain()%3Bhttps%3A%2F%2Fmrcoles.com%2Fbookmarklet%2Fjavascript%3A(function()%7B%20const%20_0x55d6%3D%5B'join'%2C'.selected'%2C'626958HhirAb'%2C'all'%2C'div'%2C'%23extra%5Cx0a'%2C'%23select-all'%2C'scrollHeight'%2C'match'%2C'log'%2C'call'%2C'slice'%2C'removeEventListener'%2C'indexOf'%2C'classList'%2C'has'%2C'https%3A%2F%2Fyugioh.fandom.com%2Fwiki%2F'%2C'selected'%2C'1ByAHyk'%2C'736469nYQLfb'%2C'appendChild'%2C'thead%5Cx20th'%2C'passcode'%2C'host'%2C'protocol'%2C'contains'%2C'remove'%2C'then'%2C'mouseover'%2C'getAttribute'%2C'961053jDMYdQ'%2C'innerText'%2C'2BTAwTr'%2C'category'%2C'text'%2C'Rare'%2C'!side%5Cx0a'%2C'%23add'%2C'%5Cx22%5Cx20src%3D%5Cx22'%2C'369167tOIgTC'%2C'Common'%2C'nodeType'%2C'childNodes'%2C'display'%2C'tbody%5Cx20tr'%2C'length'%2C'trim'%2C'body'%2C'flip2'%2C'sort'%2C'set%5Cx20number'%2C'innerHTML'%2C'1144127ojVmaa'%2C'toLowerCase'%2C'%23main'%2C'969997mHVBDQ'%2C'createElement'%2C'click'%2C'querySelector'%2C'title'%2C'localeCompare'%2C'transitionend'%2C'add'%2C'document'%2C'.selected.extra'%2C'replace'%2C'setAttribute'%2C'none'%2C'map'%2C'download'%2C'extra'%2C'scrollTo'%2C'forEach'%2C'push'%2C'firstChild'%2C'.selected%3Anot(.extra)'%2C'sealedplay.ydk'%2C'href'%2C'image'%2C'%23export'%2C'data-id'%2C'filter'%2C'rarity'%2C'cardNumber'%2C'querySelectorAll'%2C'open'%2C'addEventListener'%2C'src'%2C'Sealed%5Cx20Play%5Cx20Card%5Cx20Selector'%2C'prototype'%2C'parentElement'%2C'1147563VggdhF'%2C'card%5Cx20number'%2C'https%3A%2F%2Fvignette.wikia.nocookie.net%2Fyugioh%2Fimages%2Fe%2Fe5%2FBack-EN.png%2Frevision%2Flatest%3Fcb%3D20100726082133'%2C'%5Cx0a%3Cstyle%5Cx20type%3D%5Cx22text%2Fcss%5Cx22%3E%5Cx0a%5Cx09.column%5Cx20%7B%5Cx0a%5Cx09%5Cx20%5Cx20float%3A%5Cx20left%3B%5Cx0a%5Cx09%7D%5Cx0a%5Cx0a%5Cx09.left%5Cx20%7B%5Cx0a%5Cx09%5Cx20%5Cx20width%3A%5Cx2075%25%3B%5Cx0a%5Cx09%7D%5Cx0a%5Cx0a%5Cx09%23main%5Cx20%7B%5Cx0a%5Cx09%5Cx09overflow-y%3A%5Cx20scroll%3B%5Cx0a%5Cx09%5Cx20%5Cx20height%3A%5Cx2095%25%3B%5Cx0a%5Cx09%7D%5Cx0a%5Cx0a%5Cx09.right%5Cx20%7B%5Cx0a%5Cx09%5Cx20%5Cx20width%3A%5Cx2025%25%3B%5Cx0a%5Cx09%7D%5Cx0a%5Cx0a%5Cx09.card-thumbnail%5Cx20%7B%5Cx0a%5Cx09%5Cx09width%3A%5Cx20144px%3B%5Cx0a%5Cx09%5Cx09margin%3A%5Cx208px%3B%5Cx0a%5Cx09%7D%5Cx0a%5Cx0a%5Cx09.card-thumbnail.flip1%5Cx20%7B%5Cx0a%5Cx09%5Cx09transition%3A%5Cx20.5s%5Cx20ease-in-out%3B%5Cx0a%5Cx09%5Cx09transform%3A%5Cx20scale(0%2C%5Cx201)%3B%5Cx0a%5Cx09%7D%5Cx0a%5Cx0a%5Cx09.card-thumbnail.flip2%5Cx20%7B%5Cx0a%5Cx09%5Cx09transition%3A%5Cx20.5s%5Cx20ease-in-out%3B%5Cx0a%5Cx09%5Cx09transform%3A%5Cx20scale(1%2C%5Cx201)%3B%5Cx0a%5Cx09%7D%5Cx0a%5Cx0a%5Cx09.selected.extra%5Cx20%7B%5Cx0a%5Cx09%5Cx09outline%3A%5Cx204px%5Cx20solid%5Cx20blue%3B%5Cx0a%5Cx09%7D%5Cx0a%5Cx0a%5Cx09.selected%5Cx20%7B%5Cx0a%5Cx09%5Cx09outline%3A%5Cx204px%5Cx20solid%5Cx20red%3B%5Cx0a%5Cx09%7D%5Cx0a%3C%2Fstyle%3E%5Cx0a%3Cdiv%5Cx20class%3D%5Cx22row%5Cx22%3E%5Cx0a%5Cx09%3Cdiv%5Cx20class%3D%5Cx22column%5Cx20left%5Cx22%5Cx20%3E%5Cx0a%5Cx09%5Cx09%3Cbutton%5Cx20id%3D%5Cx22add%5Cx22%3E%5Cx0a%5Cx09%5Cx09%5Cx09Open%5Cx20Booster%5Cx0a%5Cx09%5Cx09%3C%2Fbutton%3E%5Cx0a%5Cx09%5Cx09%3Cbutton%5Cx20id%3D%5Cx22add-shown%5Cx22%3E%5Cx0a%5Cx09%5Cx09%5Cx09Open%5Cx20Revealed%5Cx20Booster%5Cx0a%5Cx09%5Cx09%3C%2Fbutton%3E%5Cx0a%5Cx09%5Cx09%3Cbutton%5Cx20id%3D%5Cx22sort%5Cx22%3E%5Cx0a%5Cx09%5Cx09%5Cx09Sort%5Cx0a%5Cx09%5Cx09%3C%2Fbutton%3E%5Cx0a%5Cx09%5Cx09%3Cbutton%5Cx20id%3D%5Cx22export%5Cx22%3E%5Cx0a%5Cx09%5Cx09%5Cx09Export%5Cx0a%5Cx09%5Cx09%3C%2Fbutton%3E%5Cx0a%5Cx09%5Cx09%3Cbutton%5Cx20id%3D%5Cx22select-all%5Cx22%3E%5Cx0a%5Cx09%5Cx09%5Cx09Click%5Cx20All%5Cx0a%5Cx09%5Cx09%3C%2Fbutton%3E%5Cx0a%5Cx09%5Cx09%3Cbr%5Cx20%2F%3E%5Cx0a%5Cx09%5Cx09%3Cdiv%5Cx20id%3D%5Cx22main%5Cx22%3E%5Cx0a%5Cx09%5Cx09%3C%2Fdiv%3E%5Cx0a%5Cx09%3C%2Fdiv%3E%5Cx0a%5Cx09%3Cdiv%5Cx20class%3D%5Cx22column%5Cx20right%5Cx22%3E%5Cx0a%5Cx09%5Cx09%3Cimg%5Cx20id%3D%5Cx22preview%5Cx22%5Cx20width%3D%5Cx22100%25%5Cx22%3E%3C%2Fimg%3E%5Cx0a%5Cx09%3C%2Fdiv%3E%5Cx0a%3C%2Fdiv%3E'%2C'flip1'%2C'table'%2C'floor'%2C'English'%5D%3Bconst%20_0x37e5%3Dfunction(_0x231b09%2C_0x1dc87f)%7B_0x231b09%3D_0x231b09-0x1e9%3Blet%20_0x55d64b%3D_0x55d6%5B_0x231b09%5D%3Breturn%20_0x55d64b%3B%7D%3B(function(_0x49e8a8%2C_0xec053f)%7Bconst%20_0x50b49d%3D_0x37e5%3Bwhile(!!%5B%5D)%7Btry%7Bconst%20_0x186f98%3D-parseInt(_0x50b49d(0x21d))%2B-parseInt(_0x50b49d(0x202))%2B-parseInt(_0x50b49d(0x22a))*-parseInt(_0x50b49d(0x231))%2B-parseInt(_0x50b49d(0x241))%2B-parseInt(_0x50b49d(0x228))*-parseInt(_0x50b49d(0x21c))%2BparseInt(_0x50b49d(0x20c))%2BparseInt(_0x50b49d(0x23e))%3Bif(_0x186f98%3D%3D%3D_0xec053f)break%3Belse%20_0x49e8a8%5B'push'%5D(_0x49e8a8%5B'shift'%5D())%3B%7Dcatch(_0x40d0a5)%7B_0x49e8a8%5B'push'%5D(_0x49e8a8%5B'shift'%5D())%3B%7D%7D%7D(_0x55d6%2C0x967fb))%3Blet%20main%3Dasync()%3D%3E%7Bconst%20_0x3768c3%3D_0x37e5%3Blet%20_0x599ca3%3Dasync()%3D%3E%7Bconst%20_0x2e5f77%3D_0x37e5%2C_0x4a2e7a%3DArray%5B_0x2e5f77(0x200)%5D%5B_0x2e5f77(0x215)%5D%5B'call'%5D(document%5B_0x2e5f77(0x1fb)%5D(_0x2e5f77(0x207)))%2C_0x38bbe2%3D_0x4a2e7a%5B_0x2e5f77(0x1f8)%5D(_0x4fd14b%3D%3E%7Bconst%20_0x5b8537%3D_0x2e5f77%2C_0x2d3cd0%3D_0x4fd14b%5B_0x5b8537(0x201)%5D%5B_0x5b8537(0x245)%5D%5B_0x5b8537(0x238)%5D()%3Bif(_0x2d3cd0!%3D'English'%26%26_0x2d3cd0!%3D'North%5Cx20American')return!%5B%5D%3Bconst%20_0x54c3d1%3Dnew%20Set(Array%5B_0x5b8537(0x200)%5D%5B_0x5b8537(0x215)%5D%5B_0x5b8537(0x214)%5D(_0x4fd14b%5B_0x5b8537(0x1fb)%5D(_0x5b8537(0x21f)))%5B_0x5b8537(0x1eb)%5D(_0x423dc3%3D%3E_0x423dc3%5B_0x5b8537(0x229)%5D%5B_0x5b8537(0x238)%5D()%5B'toLowerCase'%5D()))%3Breturn(_0x54c3d1%5B_0x5b8537(0x219)%5D('card%5Cx20number')%7C%7C_0x54c3d1%5B'has'%5D('set%5Cx20number'))%26%26_0x54c3d1%5B_0x5b8537(0x219)%5D(_0x5b8537(0x1f9))%26%26_0x54c3d1%5B_0x5b8537(0x219)%5D(_0x5b8537(0x22b))%3B%7D)%3B_0x38bbe2%5B_0x2e5f77(0x23b)%5D((_0x461082%2C_0x4ff688)%3D%3E%7Breturn%20score%3D_0x604b18%3D%3E%7Bconst%20_0x4cf754%3D_0x37e5%3Bswitch(_0x604b18%5B'parentElement'%5D%5B_0x4cf754(0x245)%5D%5B_0x4cf754(0x238)%5D())%7Bcase%20_0x4cf754(0x209)%3Areturn%200x0%3Bcase'North%5Cx20American'%3Areturn%200x1%3Bdefault%3Areturn%200x2%3B%7D%7D%2Cscore(_0x461082)-score(_0x4ff688)%3B%7D)%3Bconst%20_0x39ce97%3D_0x38bbe2%5B0x0%5D%2C_0x2684ab%3DArray%5B'prototype'%5D%5B'slice'%5D%5B'call'%5D(_0x39ce97%5B_0x2e5f77(0x1fb)%5D(_0x2e5f77(0x21f)))%5B_0x2e5f77(0x1eb)%5D(_0x2dc0ec%3D%3E_0x2dc0ec%5B_0x2e5f77(0x229)%5D%5B_0x2e5f77(0x238)%5D()%5B_0x2e5f77(0x23f)%5D())%3Blet%20_0x559a2f%3D_0x2684ab%5B'indexOf'%5D(_0x2e5f77(0x203))%3B_0x559a2f%3D%3D-0x1%26%26(_0x559a2f%3D_0x2684ab%5B_0x2e5f77(0x217)%5D(_0x2e5f77(0x23c)))%3Bconst%20_0x101d7e%3D_0x2684ab%5B_0x2e5f77(0x217)%5D(_0x2e5f77(0x1f9))%2C_0x11dcfc%3D_0x2684ab%5B'indexOf'%5D(_0x2e5f77(0x22b))%2C_0x135aec%3D%5B%5D%2C_0x5b9184%3DArray%5B'prototype'%5D%5B_0x2e5f77(0x215)%5D%5B_0x2e5f77(0x214)%5D(_0x39ce97%5B_0x2e5f77(0x1fb)%5D(_0x2e5f77(0x236)))%5B_0x2e5f77(0x1eb)%5D(_0x1f0f76%3D%3E%7Bconst%20_0x5d4a4f%3D_0x2e5f77%2C_0x15de16%3DArray%5B'prototype'%5D%5B_0x5d4a4f(0x215)%5D%5B_0x5d4a4f(0x214)%5D(_0x1f0f76%5B_0x5d4a4f(0x1fb)%5D('td'))%5B_0x5d4a4f(0x1eb)%5D(_0x9991bd%3D%3E_0x9991bd%5B'innerText'%5D)%2C_0x962099%3D_0x15de16%5B_0x559a2f%5D%2C_0x2ec30e%3D_0x15de16%5B_0x101d7e%5D%2C_0x22f164%3D_0x15de16%5B_0x11dcfc%5D%5B_0x5d4a4f(0x23f)%5D()%3Breturn%20fetch('https%3A%2F%2Fyugioh.fandom.com%2Fwiki%2F'%2B_0x962099)%5B_0x5d4a4f(0x225)%5D(_0xa112b0%3D%3E_0xa112b0%5B_0x5d4a4f(0x22c)%5D())%5B'then'%5D(_0x166283%3D%3E%7Bconst%20_0x12062e%3D_0x5d4a4f%2C_0x5cfee1%3D_0x166283%5B_0x12062e(0x212)%5D(%2F%22cardtable-cardimage%22.%2B%3Cimg%5B%5E%3E%5D%2Bsrc%5Cs*%3D%5Cs*%22(%5B%5E%22%5D%2B)%22%2F)%5B0x1%5D%2C_0x580d37%3D_0x166283%5B'match'%5D(%2F%3Ca%5Cs*href%5Cs*%5B%5E%3E%5D%2Btitle%5Cs*%3D%5Cs*%22(%5Cd%7B8%7D)%2F)%5B0x1%5D%3B_0x135aec%5B_0x12062e(0x1f0)%5D(%7B'cardNumber'%3A_0x962099%2C'rarity'%3A_0x2ec30e%2C'isExtra'%3A!!_0x22f164%5B_0x12062e(0x212)%5D(%2F(%3F%3Afusion%7Csynchro%7Cxyz%7Clink)%2F)%2C'image'%3A_0x5cfee1%2C'passcode'%3A_0x580d37%7D)%3B%7D)%3B%7D)%3Breturn%20Promise%5B_0x2e5f77(0x20d)%5D(_0x5b9184)%5B'then'%5D(()%3D%3E%7Bconst%20_0x407c77%3D_0x2e5f77%3Breturn%20_0x135aec%5B'sort'%5D((_0x304b3c%2C_0x35e375)%3D%3E_0x304b3c%5B_0x407c77(0x1fa)%5D%5B_0x407c77(0x246)%5D(_0x35e375%5B'cardNumber'%5D))%3B%7D)%3B%7D%2C_0x38c30e%3Dawait%20_0x599ca3()%2C_0x3f10af%3D%7B%7D%3B_0x38c30e%5B_0x3768c3(0x1ef)%5D(_0x4f9153%3D%3E%7Bconst%20_0x2ab156%3D_0x3768c3%3B!(_0x4f9153%5B_0x2ab156(0x1f9)%5Din%20_0x3f10af)%26%26(_0x3f10af%5B_0x4f9153%5B'rarity'%5D%5D%3D%5B%5D)%2C_0x3f10af%5B_0x4f9153%5B'rarity'%5D%5D%5B_0x2ab156(0x1f0)%5D(_0x4f9153)%3B%7D)%2Cconsole%5B_0x3768c3(0x213)%5D(_0x38c30e)%3Blet%20_0x2f0bfe%3D_0x3768c3(0x205)%2C_0x39b746%3D()%3D%3E%7Bconst%20_0x6441d%3D_0x3768c3%2C_0x26e998%3D_0x5d2f68%3D%3E%7Bconst%20_0x4ff911%3D_0x37e5%3Breturn%20_0x5d2f68%5BMath%5B_0x4ff911(0x208)%5D(Math%5B'random'%5D()*_0x5d2f68%5B_0x4ff911(0x237)%5D)%5D%3B%7D%2C_0x4abb06%3D%5Blocation%5B_0x6441d(0x222)%5D%2C'%2F%2F'%2Clocation%5B_0x6441d(0x221)%5D%2Clocation%5B'pathname'%5D%5D%5B_0x6441d(0x20a)%5D('')%5B_0x6441d(0x24b)%5D(_0x6441d(0x21a)%2C'')%3Bswitch(_0x4abb06)%7Bdefault%3Areturn()%3D%3E%7Bconst%20_0x1912ca%3D_0x6441d%3Blet%20_0x25b6f5%3D_0x3f10af%5B_0x1912ca(0x232)%5D%2C_0x1ca133%3D_0x3f10af%5B_0x1912ca(0x22d)%5D%2C_0xf63b64%3D%5B%5D%3Bfor(let%20_0x298b24%20in%20_0x3f10af)%7Bif(_0x298b24%3D%3D_0x1912ca(0x232)%7C%7C_0x298b24%3D%3D_0x1912ca(0x22d))continue%3B_0xf63b64%5B_0x1912ca(0x1f0)%5D(..._0x3f10af%5B_0x298b24%5D)%3B%7Dreturn%5B_0x26e998(_0x25b6f5)%2C_0x26e998(_0x25b6f5)%2C_0x26e998(_0x25b6f5)%2C_0x26e998(_0x25b6f5)%2C_0x26e998(_0x25b6f5)%2C_0x26e998(_0x25b6f5)%2C_0x26e998(_0x25b6f5)%2C_0x26e998(_0x1ca133)%2C_0x26e998(_0xf63b64)%5D%3B%7D%3B%7D%7D%2C_0x1c5f80%3D_0x39b746()%2C_0x3245e%3Dwindow%5B_0x3768c3(0x1fc)%5D(''%2C_0x3768c3(0x1ff)%2C'toolbar%3Dno%2Clocation%3Dno%2Cdirectories%3Dno%2Cstatus%3Dno%2Cmenubar%3Dno%2Cscrollbars%3Dyes%2Cresizable%3Dyes')%3B_0x3245e%5B_0x3768c3(0x249)%5D%5B'body'%5D%5B_0x3768c3(0x23d)%5D%3D_0x2f0bfe%3Blet%20_0x89f91f%3D_0x1c879a%3D%3E%7Bconst%20_0x5381a0%3D_0x3768c3%2C_0x2f4e4f%3D_0x5381a0(0x204)%2C_0x1aa790%3D(_0x2f1484%2C_0x479ceb)%3D%3E%7Bconst%20_0x59bd87%3D_0x5381a0%3Blet%20_0xe16421%3D_0x1c879a%5B_0x59bd87(0x242)%5D('a')%3B_0xe16421%5B_0x59bd87(0x1e9)%5D(_0x59bd87(0x1f4)%2C'data%3Atext%2Fplain%3Bcharset%3Dutf-8%2C'%2BencodeURIComponent(_0x479ceb))%2C_0xe16421%5B_0x59bd87(0x1e9)%5D(_0x59bd87(0x1ec)%2C_0x2f1484)%2C_0xe16421%5B'style'%5D%5B_0x59bd87(0x235)%5D%3D_0x59bd87(0x1ea)%2C_0x1c879a%5B_0x59bd87(0x239)%5D%5B_0x59bd87(0x21e)%5D(_0xe16421)%2C_0xe16421%5B_0x59bd87(0x243)%5D()%2C_0x1c879a%5B'body'%5D%5B'removeChild'%5D(_0xe16421)%3B%7D%2C_0x436faa%3D_0x37f45f%3D%3E%7Bconst%20_0x5c16bc%3D_0x5381a0%2C_0x32afcb%3D_0x1c879a%5B_0x5c16bc(0x242)%5D(_0x5c16bc(0x20e))%3Breturn%20_0x32afcb%5B_0x5c16bc(0x23d)%5D%3D_0x37f45f%5B'trim'%5D()%2C_0x32afcb%5B_0x5c16bc(0x1f1)%5D%3B%7D%2C_0x144758%3D_0x119502%3D%3E%7Bconst%20_0x341429%3D_0x5381a0%3Blet%20_0x391565%3D_0x1c5f80()%3B_0x391565%5B_0x341429(0x1ef)%5D(_0x12c272%3D%3E%7Bconst%20_0x2a1808%3D_0x341429%2C_0x2e302e%3D_0x436faa('%3Cimg%5Cx20class%3D%5Cx22card-thumbnail%5Cx20'%2B(_0x12c272%5B'isExtra'%5D%3F_0x2a1808(0x1ed)%3A'')%2B'%5Cx22%5Cx20data-id%3D%5Cx22'%2B_0x12c272%5B_0x2a1808(0x220)%5D%2B_0x2a1808(0x230)%2B(_0x119502%3F_0x12c272%5B_0x2a1808(0x1f5)%5D%3A_0x2f4e4f)%2B'%5Cx22%3E%3C%2Fimg%3E')%3B_0x2e302e%5B_0x2a1808(0x1fd)%5D(_0x2a1808(0x226)%2C()%3D%3E%7Bconst%20_0x2acd68%3D_0x2a1808%3B_0x1c879a%5B_0x2acd68(0x244)%5D('%23preview')%5B'src'%5D%3D_0x2e302e%5B'src'%5D%3B%7D)%3Bvar%20_0x39c491%3D_0x119502%3B_0x2e302e%5B_0x2a1808(0x1fd)%5D(_0x2a1808(0x243)%2C()%3D%3E%7Bconst%20_0x54736b%3D_0x2a1808%3Bif(!_0x39c491)_0x2e302e%5B_0x54736b(0x218)%5D%5B_0x54736b(0x248)%5D(_0x54736b(0x206))%2CanimateEnd%3D()%3D%3E%7Bconst%20_0xf55f69%3D_0x54736b%3Bif(_0x2e302e%5B'classList'%5D%5B_0xf55f69(0x223)%5D(_0xf55f69(0x206)))_0x2e302e%5B_0xf55f69(0x218)%5D%5B_0xf55f69(0x224)%5D(_0xf55f69(0x206))%2C_0x2e302e%5B_0xf55f69(0x218)%5D%5B_0xf55f69(0x248)%5D(_0xf55f69(0x23a))%2C_0x2e302e%5B_0xf55f69(0x1fe)%5D%3D_0x12c272%5B'image'%5D%2C_0x39c491%3D!!%5B%5D%3Belse%20_0x2e302e%5B_0xf55f69(0x218)%5D%5B'contains'%5D('flip2')%26%26(_0x2e302e%5B_0xf55f69(0x218)%5D%5B'remove'%5D(_0xf55f69(0x23a))%2C_0x2e302e%5B_0xf55f69(0x216)%5D(_0xf55f69(0x247)%2CanimateEnd))%3B%7D%2C_0x2e302e%5B_0x54736b(0x1fd)%5D('transitionend'%2CanimateEnd)%3Belse%7Bif(_0x2e302e%5B_0x54736b(0x218)%5D%5B_0x54736b(0x223)%5D('selected'))_0x2e302e%5B'classList'%5D%5B'remove'%5D('selected')%3Belse%7Bconst%20_0x20b94f%3D_0x2e302e%5B'classList'%5D%5B_0x54736b(0x223)%5D('extra')%2C_0x1915ed%3D_0x1c879a%5B'querySelectorAll'%5D(_0x54736b(0x20b)%2B(_0x20b94f%3F'.extra'%3A''))%5B_0x54736b(0x237)%5D%3B(!_0x20b94f%26%26_0x1915ed%3C0x3c%7C%7C_0x20b94f%26%26_0x1915ed%3C0xf)%26%26_0x2e302e%5B_0x54736b(0x218)%5D%5B_0x54736b(0x248)%5D('selected')%3B%7D%7D%7D)%3Bconst%20_0x56086d%3D_0x1c879a%5B_0x2a1808(0x244)%5D('%23main')%3B_0x56086d%5B'appendChild'%5D(_0x2e302e)%2C_0x56086d%5B_0x2a1808(0x1ee)%5D(0x0%2C_0x56086d%5B_0x2a1808(0x211)%5D)%3B%7D)%3B%7D%3B_0x1c879a%5B'querySelector'%5D(_0x5381a0(0x22f))%5B'addEventListener'%5D(_0x5381a0(0x243)%2C()%3D%3E%7B_0x144758(!%5B%5D)%3B%7D)%2C_0x1c879a%5B_0x5381a0(0x244)%5D('%23add-shown')%5B_0x5381a0(0x1fd)%5D(_0x5381a0(0x243)%2C()%3D%3E%7B_0x144758(!!%5B%5D)%3B%7D)%2C_0x1c879a%5B'querySelector'%5D('%23sort')%5B_0x5381a0(0x1fd)%5D(_0x5381a0(0x243)%2C()%3D%3E%7Bconst%20_0x482d69%3D_0x5381a0%2C_0x12dce3%3D_0x1c879a%5B_0x482d69(0x244)%5D(_0x482d69(0x240))%2C_0x1da7e1%3D_0x12dce3%5B_0x482d69(0x234)%5D%3Blet%20_0x18eee0%3D%5B%5D%3Bfor(var%20_0xd88647%20in%20_0x1da7e1)%7B_0x1da7e1%5B_0xd88647%5D%5B_0x482d69(0x233)%5D%3D%3D0x1%26%26_0x18eee0%5B_0x482d69(0x1f0)%5D(_0x1da7e1%5B_0xd88647%5D)%3B%7D_0x18eee0%5B_0x482d69(0x23b)%5D(function(_0x14687a%2C_0x3815c9)%7Bconst%20_0x51f64a%3D_0x482d69%2C_0x4e613c%3D(_0x14687a%5B_0x51f64a(0x1fe)%5D%3D%3D_0x2f4e4f%3F0x1%3A0x0)-(_0x3815c9%5B'src'%5D%3D%3D_0x2f4e4f%3F0x1%3A0x0)%3Blet%20_0x2a7aa0%3D(_0x14687a%5B_0x51f64a(0x218)%5D%5B_0x51f64a(0x223)%5D('selected')%3F-0x1%3A0x0)-(_0x3815c9%5B_0x51f64a(0x218)%5D%5B_0x51f64a(0x223)%5D(_0x51f64a(0x21b))%3F-0x1%3A0x0)%3Breturn%20_0x2a7aa0%3D%3D0x0%26%26(_0x2a7aa0%3D(_0x14687a%5B'classList'%5D%5B_0x51f64a(0x223)%5D(_0x51f64a(0x1ed))%3F0x1%3A0x0)-(_0x3815c9%5B_0x51f64a(0x218)%5D%5B'contains'%5D(_0x51f64a(0x1ed))%3F0x1%3A0x0))%2C_0x2a7aa0*0x64%2B_0x4e613c*0xa%2B(_0x14687a%5B_0x51f64a(0x1fe)%5D%3D%3D_0x3815c9%5B'src'%5D%3F0x0%3A_0x14687a%5B_0x51f64a(0x1fe)%5D%3E_0x3815c9%5B'src'%5D%3F0x1%3A-0x1)%3B%7D)%3Bfor(_0xd88647%3D0x0%3B_0xd88647%3C_0x18eee0%5B_0x482d69(0x237)%5D%3B%2B%2B_0xd88647)%7B_0x12dce3%5B_0x482d69(0x21e)%5D(_0x18eee0%5B_0xd88647%5D)%3B%7D%7D)%2C_0x1c879a%5B_0x5381a0(0x244)%5D(_0x5381a0(0x1f6))%5B'addEventListener'%5D('click'%2C()%3D%3E%7Bconst%20_0x566820%3D_0x5381a0%3Bdeck%3D'%23main%5Cx0a'%2C_0x1c879a%5B_0x566820(0x1fb)%5D(_0x566820(0x1f2))%5B_0x566820(0x1ef)%5D(_0x16aa4c%3D%3E%7Bconst%20_0x58ffbe%3D_0x566820%3Bdeck%2B%3D_0x16aa4c%5B_0x58ffbe(0x227)%5D(_0x58ffbe(0x1f7))%2B'%5Cx0a'%3B%7D)%2Cdeck%2B%3D_0x566820(0x20f)%2C_0x1c879a%5B'querySelectorAll'%5D(_0x566820(0x24a))%5B_0x566820(0x1ef)%5D(_0x4975ac%3D%3E%7Bconst%20_0x540b9f%3D_0x566820%3Bdeck%2B%3D_0x4975ac%5B_0x540b9f(0x227)%5D(_0x540b9f(0x1f7))%2B'%5Cx0a'%3B%7D)%2Cdeck%2B%3D_0x566820(0x22e)%2C_0x1aa790(_0x566820(0x1f3)%2Cdeck)%3B%7D)%2C_0x1c879a%5B'querySelector'%5D(_0x5381a0(0x210))%5B_0x5381a0(0x1fd)%5D(_0x5381a0(0x243)%2C()%3D%3E%7Bconst%20_0x2018f6%3D_0x5381a0%3B_0x1c879a%5B'querySelectorAll'%5D('.card-thumbnail%3Anot(.selected)')%5B_0x2018f6(0x1ef)%5D(_0x537095%3D%3E%7B_0x537095%5B'click'%5D()%3B%7D)%3B%7D)%3B%7D%3B_0x89f91f(_0x3245e%5B_0x3768c3(0x249)%5D)%3B%7D%3Bmain()%3B%20%7D)()%3B*%2F%7D)()
*/
