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
			case 'Battle_Pack_3:_Monster_League':
				return () => {
					let commons = cardsByRarity['Common\nShatterfoil Rare'];
					let rares = cardsByRarity['Rare\nShatterfoil Rare'];
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
https://obfuscator.io/
const _0x55d6=['join','.selected','626958HhirAb','all','div','#extra\x0a','#select-all','scrollHeight','match','log','call','slice','removeEventListener','indexOf','classList','has','https://yugioh.fandom.com/wiki/','selected','1ByAHyk','736469nYQLfb','appendChild','thead\x20th','passcode','host','protocol','contains','remove','then','mouseover','getAttribute','961053jDMYdQ','innerText','2BTAwTr','category','text','Rare','!side\x0a','#add','\x22\x20src=\x22','369167tOIgTC','Common','nodeType','childNodes','display','tbody\x20tr','length','trim','body','flip2','sort','set\x20number','innerHTML','1144127ojVmaa','toLowerCase','#main','969997mHVBDQ','createElement','click','querySelector','title','localeCompare','transitionend','add','document','.selected.extra','replace','setAttribute','none','map','download','extra','scrollTo','forEach','push','firstChild','.selected:not(.extra)','sealedplay.ydk','href','image','#export','data-id','filter','rarity','cardNumber','querySelectorAll','open','addEventListener','src','Sealed\x20Play\x20Card\x20Selector','prototype','parentElement','1147563VggdhF','card\x20number','https://vignette.wikia.nocookie.net/yugioh/images/e/e5/Back-EN.png/revision/latest?cb=20100726082133','\x0a<style\x20type=\x22text/css\x22>\x0a\x09.column\x20{\x0a\x09\x20\x20float:\x20left;\x0a\x09}\x0a\x0a\x09.left\x20{\x0a\x09\x20\x20width:\x2075%;\x0a\x09}\x0a\x0a\x09#main\x20{\x0a\x09\x09overflow-y:\x20scroll;\x0a\x09\x20\x20height:\x2095%;\x0a\x09}\x0a\x0a\x09.right\x20{\x0a\x09\x20\x20width:\x2025%;\x0a\x09}\x0a\x0a\x09.card-thumbnail\x20{\x0a\x09\x09width:\x20144px;\x0a\x09\x09margin:\x208px;\x0a\x09}\x0a\x0a\x09.card-thumbnail.flip1\x20{\x0a\x09\x09transition:\x20.5s\x20ease-in-out;\x0a\x09\x09transform:\x20scale(0,\x201);\x0a\x09}\x0a\x0a\x09.card-thumbnail.flip2\x20{\x0a\x09\x09transition:\x20.5s\x20ease-in-out;\x0a\x09\x09transform:\x20scale(1,\x201);\x0a\x09}\x0a\x0a\x09.selected.extra\x20{\x0a\x09\x09outline:\x204px\x20solid\x20blue;\x0a\x09}\x0a\x0a\x09.selected\x20{\x0a\x09\x09outline:\x204px\x20solid\x20red;\x0a\x09}\x0a</style>\x0a<div\x20class=\x22row\x22>\x0a\x09<div\x20class=\x22column\x20left\x22\x20>\x0a\x09\x09<button\x20id=\x22add\x22>\x0a\x09\x09\x09Open\x20Booster\x0a\x09\x09</button>\x0a\x09\x09<button\x20id=\x22add-shown\x22>\x0a\x09\x09\x09Open\x20Revealed\x20Booster\x0a\x09\x09</button>\x0a\x09\x09<button\x20id=\x22sort\x22>\x0a\x09\x09\x09Sort\x0a\x09\x09</button>\x0a\x09\x09<button\x20id=\x22export\x22>\x0a\x09\x09\x09Export\x0a\x09\x09</button>\x0a\x09\x09<button\x20id=\x22select-all\x22>\x0a\x09\x09\x09Click\x20All\x0a\x09\x09</button>\x0a\x09\x09<br\x20/>\x0a\x09\x09<div\x20id=\x22main\x22>\x0a\x09\x09</div>\x0a\x09</div>\x0a\x09<div\x20class=\x22column\x20right\x22>\x0a\x09\x09<img\x20id=\x22preview\x22\x20width=\x22100%\x22></img>\x0a\x09</div>\x0a</div>','flip1','table','floor','English'];const _0x37e5=function(_0x231b09,_0x1dc87f){_0x231b09=_0x231b09-0x1e9;let _0x55d64b=_0x55d6[_0x231b09];return _0x55d64b;};(function(_0x49e8a8,_0xec053f){const _0x50b49d=_0x37e5;while(!![]){try{const _0x186f98=-parseInt(_0x50b49d(0x21d))+-parseInt(_0x50b49d(0x202))+-parseInt(_0x50b49d(0x22a))*-parseInt(_0x50b49d(0x231))+-parseInt(_0x50b49d(0x241))+-parseInt(_0x50b49d(0x228))*-parseInt(_0x50b49d(0x21c))+parseInt(_0x50b49d(0x20c))+parseInt(_0x50b49d(0x23e));if(_0x186f98===_0xec053f)break;else _0x49e8a8['push'](_0x49e8a8['shift']());}catch(_0x40d0a5){_0x49e8a8['push'](_0x49e8a8['shift']());}}}(_0x55d6,0x967fb));let main=async()=>{const _0x3768c3=_0x37e5;let _0x599ca3=async()=>{const _0x2e5f77=_0x37e5,_0x4a2e7a=Array[_0x2e5f77(0x200)][_0x2e5f77(0x215)]['call'](document[_0x2e5f77(0x1fb)](_0x2e5f77(0x207))),_0x38bbe2=_0x4a2e7a[_0x2e5f77(0x1f8)](_0x4fd14b=>{const _0x5b8537=_0x2e5f77,_0x2d3cd0=_0x4fd14b[_0x5b8537(0x201)][_0x5b8537(0x245)][_0x5b8537(0x238)]();if(_0x2d3cd0!='English'&&_0x2d3cd0!='North\x20American')return![];const _0x54c3d1=new Set(Array[_0x5b8537(0x200)][_0x5b8537(0x215)][_0x5b8537(0x214)](_0x4fd14b[_0x5b8537(0x1fb)](_0x5b8537(0x21f)))[_0x5b8537(0x1eb)](_0x423dc3=>_0x423dc3[_0x5b8537(0x229)][_0x5b8537(0x238)]()['toLowerCase']()));return(_0x54c3d1[_0x5b8537(0x219)]('card\x20number')||_0x54c3d1['has']('set\x20number'))&&_0x54c3d1[_0x5b8537(0x219)](_0x5b8537(0x1f9))&&_0x54c3d1[_0x5b8537(0x219)](_0x5b8537(0x22b));});_0x38bbe2[_0x2e5f77(0x23b)]((_0x461082,_0x4ff688)=>{return score=_0x604b18=>{const _0x4cf754=_0x37e5;switch(_0x604b18['parentElement'][_0x4cf754(0x245)][_0x4cf754(0x238)]()){case _0x4cf754(0x209):return 0x0;case'North\x20American':return 0x1;default:return 0x2;}},score(_0x461082)-score(_0x4ff688);});const _0x39ce97=_0x38bbe2[0x0],_0x2684ab=Array['prototype']['slice']['call'](_0x39ce97[_0x2e5f77(0x1fb)](_0x2e5f77(0x21f)))[_0x2e5f77(0x1eb)](_0x2dc0ec=>_0x2dc0ec[_0x2e5f77(0x229)][_0x2e5f77(0x238)]()[_0x2e5f77(0x23f)]());let _0x559a2f=_0x2684ab['indexOf'](_0x2e5f77(0x203));_0x559a2f==-0x1&&(_0x559a2f=_0x2684ab[_0x2e5f77(0x217)](_0x2e5f77(0x23c)));const _0x101d7e=_0x2684ab[_0x2e5f77(0x217)](_0x2e5f77(0x1f9)),_0x11dcfc=_0x2684ab['indexOf'](_0x2e5f77(0x22b)),_0x135aec=[],_0x5b9184=Array['prototype'][_0x2e5f77(0x215)][_0x2e5f77(0x214)](_0x39ce97[_0x2e5f77(0x1fb)](_0x2e5f77(0x236)))[_0x2e5f77(0x1eb)](_0x1f0f76=>{const _0x5d4a4f=_0x2e5f77,_0x15de16=Array['prototype'][_0x5d4a4f(0x215)][_0x5d4a4f(0x214)](_0x1f0f76[_0x5d4a4f(0x1fb)]('td'))[_0x5d4a4f(0x1eb)](_0x9991bd=>_0x9991bd['innerText']),_0x962099=_0x15de16[_0x559a2f],_0x2ec30e=_0x15de16[_0x101d7e],_0x22f164=_0x15de16[_0x11dcfc][_0x5d4a4f(0x23f)]();return fetch('https://yugioh.fandom.com/wiki/'+_0x962099)[_0x5d4a4f(0x225)](_0xa112b0=>_0xa112b0[_0x5d4a4f(0x22c)]())['then'](_0x166283=>{const _0x12062e=_0x5d4a4f,_0x5cfee1=_0x166283[_0x12062e(0x212)](/"cardtable-cardimage".+<img[^>]+src\s*=\s*"([^"]+)"/)[0x1],_0x580d37=_0x166283['match'](/<a\s*href\s*[^>]+title\s*=\s*"(\d{8})/)[0x1];_0x135aec[_0x12062e(0x1f0)]({'cardNumber':_0x962099,'rarity':_0x2ec30e,'isExtra':!!_0x22f164[_0x12062e(0x212)](/(?:fusion|synchro|xyz|link)/),'image':_0x5cfee1,'passcode':_0x580d37});});});return Promise[_0x2e5f77(0x20d)](_0x5b9184)['then'](()=>{const _0x407c77=_0x2e5f77;return _0x135aec['sort']((_0x304b3c,_0x35e375)=>_0x304b3c[_0x407c77(0x1fa)][_0x407c77(0x246)](_0x35e375['cardNumber']));});},_0x38c30e=await _0x599ca3(),_0x3f10af={};_0x38c30e[_0x3768c3(0x1ef)](_0x4f9153=>{const _0x2ab156=_0x3768c3;!(_0x4f9153[_0x2ab156(0x1f9)]in _0x3f10af)&&(_0x3f10af[_0x4f9153['rarity']]=[]),_0x3f10af[_0x4f9153['rarity']][_0x2ab156(0x1f0)](_0x4f9153);}),console[_0x3768c3(0x213)](_0x38c30e);let _0x2f0bfe=_0x3768c3(0x205),_0x39b746=()=>{const _0x6441d=_0x3768c3,_0x26e998=_0x5d2f68=>{const _0x4ff911=_0x37e5;return _0x5d2f68[Math[_0x4ff911(0x208)](Math['random']()*_0x5d2f68[_0x4ff911(0x237)])];},_0x4abb06=[location[_0x6441d(0x222)],'//',location[_0x6441d(0x221)],location['pathname']][_0x6441d(0x20a)]('')[_0x6441d(0x24b)](_0x6441d(0x21a),'');switch(_0x4abb06){default:return()=>{const _0x1912ca=_0x6441d;let _0x25b6f5=_0x3f10af[_0x1912ca(0x232)],_0x1ca133=_0x3f10af[_0x1912ca(0x22d)],_0xf63b64=[];for(let _0x298b24 in _0x3f10af){if(_0x298b24==_0x1912ca(0x232)||_0x298b24==_0x1912ca(0x22d))continue;_0xf63b64[_0x1912ca(0x1f0)](..._0x3f10af[_0x298b24]);}return[_0x26e998(_0x25b6f5),_0x26e998(_0x25b6f5),_0x26e998(_0x25b6f5),_0x26e998(_0x25b6f5),_0x26e998(_0x25b6f5),_0x26e998(_0x25b6f5),_0x26e998(_0x25b6f5),_0x26e998(_0x1ca133),_0x26e998(_0xf63b64)];};}},_0x1c5f80=_0x39b746(),_0x3245e=window[_0x3768c3(0x1fc)]('',_0x3768c3(0x1ff),'toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes');_0x3245e[_0x3768c3(0x249)]['body'][_0x3768c3(0x23d)]=_0x2f0bfe;let _0x89f91f=_0x1c879a=>{const _0x5381a0=_0x3768c3,_0x2f4e4f=_0x5381a0(0x204),_0x1aa790=(_0x2f1484,_0x479ceb)=>{const _0x59bd87=_0x5381a0;let _0xe16421=_0x1c879a[_0x59bd87(0x242)]('a');_0xe16421[_0x59bd87(0x1e9)](_0x59bd87(0x1f4),'data:text/plain;charset=utf-8,'+encodeURIComponent(_0x479ceb)),_0xe16421[_0x59bd87(0x1e9)](_0x59bd87(0x1ec),_0x2f1484),_0xe16421['style'][_0x59bd87(0x235)]=_0x59bd87(0x1ea),_0x1c879a[_0x59bd87(0x239)][_0x59bd87(0x21e)](_0xe16421),_0xe16421[_0x59bd87(0x243)](),_0x1c879a['body']['removeChild'](_0xe16421);},_0x436faa=_0x37f45f=>{const _0x5c16bc=_0x5381a0,_0x32afcb=_0x1c879a[_0x5c16bc(0x242)](_0x5c16bc(0x20e));return _0x32afcb[_0x5c16bc(0x23d)]=_0x37f45f['trim'](),_0x32afcb[_0x5c16bc(0x1f1)];},_0x144758=_0x119502=>{const _0x341429=_0x5381a0;let _0x391565=_0x1c5f80();_0x391565[_0x341429(0x1ef)](_0x12c272=>{const _0x2a1808=_0x341429,_0x2e302e=_0x436faa('<img\x20class=\x22card-thumbnail\x20'+(_0x12c272['isExtra']?_0x2a1808(0x1ed):'')+'\x22\x20data-id=\x22'+_0x12c272[_0x2a1808(0x220)]+_0x2a1808(0x230)+(_0x119502?_0x12c272[_0x2a1808(0x1f5)]:_0x2f4e4f)+'\x22></img>');_0x2e302e[_0x2a1808(0x1fd)](_0x2a1808(0x226),()=>{const _0x2acd68=_0x2a1808;_0x1c879a[_0x2acd68(0x244)]('#preview')['src']=_0x2e302e['src'];});var _0x39c491=_0x119502;_0x2e302e[_0x2a1808(0x1fd)](_0x2a1808(0x243),()=>{const _0x54736b=_0x2a1808;if(!_0x39c491)_0x2e302e[_0x54736b(0x218)][_0x54736b(0x248)](_0x54736b(0x206)),animateEnd=()=>{const _0xf55f69=_0x54736b;if(_0x2e302e['classList'][_0xf55f69(0x223)](_0xf55f69(0x206)))_0x2e302e[_0xf55f69(0x218)][_0xf55f69(0x224)](_0xf55f69(0x206)),_0x2e302e[_0xf55f69(0x218)][_0xf55f69(0x248)](_0xf55f69(0x23a)),_0x2e302e[_0xf55f69(0x1fe)]=_0x12c272['image'],_0x39c491=!![];else _0x2e302e[_0xf55f69(0x218)]['contains']('flip2')&&(_0x2e302e[_0xf55f69(0x218)]['remove'](_0xf55f69(0x23a)),_0x2e302e[_0xf55f69(0x216)](_0xf55f69(0x247),animateEnd));},_0x2e302e[_0x54736b(0x1fd)]('transitionend',animateEnd);else{if(_0x2e302e[_0x54736b(0x218)][_0x54736b(0x223)]('selected'))_0x2e302e['classList']['remove']('selected');else{const _0x20b94f=_0x2e302e['classList'][_0x54736b(0x223)]('extra'),_0x1915ed=_0x1c879a['querySelectorAll'](_0x54736b(0x20b)+(_0x20b94f?'.extra':''))[_0x54736b(0x237)];(!_0x20b94f&&_0x1915ed<0x3c||_0x20b94f&&_0x1915ed<0xf)&&_0x2e302e[_0x54736b(0x218)][_0x54736b(0x248)]('selected');}}});const _0x56086d=_0x1c879a[_0x2a1808(0x244)]('#main');_0x56086d['appendChild'](_0x2e302e),_0x56086d[_0x2a1808(0x1ee)](0x0,_0x56086d[_0x2a1808(0x211)]);});};_0x1c879a['querySelector'](_0x5381a0(0x22f))['addEventListener'](_0x5381a0(0x243),()=>{_0x144758(![]);}),_0x1c879a[_0x5381a0(0x244)]('#add-shown')[_0x5381a0(0x1fd)](_0x5381a0(0x243),()=>{_0x144758(!![]);}),_0x1c879a['querySelector']('#sort')[_0x5381a0(0x1fd)](_0x5381a0(0x243),()=>{const _0x482d69=_0x5381a0,_0x12dce3=_0x1c879a[_0x482d69(0x244)](_0x482d69(0x240)),_0x1da7e1=_0x12dce3[_0x482d69(0x234)];let _0x18eee0=[];for(var _0xd88647 in _0x1da7e1){_0x1da7e1[_0xd88647][_0x482d69(0x233)]==0x1&&_0x18eee0[_0x482d69(0x1f0)](_0x1da7e1[_0xd88647]);}_0x18eee0[_0x482d69(0x23b)](function(_0x14687a,_0x3815c9){const _0x51f64a=_0x482d69,_0x4e613c=(_0x14687a[_0x51f64a(0x1fe)]==_0x2f4e4f?0x1:0x0)-(_0x3815c9['src']==_0x2f4e4f?0x1:0x0);let _0x2a7aa0=(_0x14687a[_0x51f64a(0x218)][_0x51f64a(0x223)]('selected')?-0x1:0x0)-(_0x3815c9[_0x51f64a(0x218)][_0x51f64a(0x223)](_0x51f64a(0x21b))?-0x1:0x0);return _0x2a7aa0==0x0&&(_0x2a7aa0=(_0x14687a['classList'][_0x51f64a(0x223)](_0x51f64a(0x1ed))?0x1:0x0)-(_0x3815c9[_0x51f64a(0x218)]['contains'](_0x51f64a(0x1ed))?0x1:0x0)),_0x2a7aa0*0x64+_0x4e613c*0xa+(_0x14687a[_0x51f64a(0x1fe)]==_0x3815c9['src']?0x0:_0x14687a[_0x51f64a(0x1fe)]>_0x3815c9['src']?0x1:-0x1);});for(_0xd88647=0x0;_0xd88647<_0x18eee0[_0x482d69(0x237)];++_0xd88647){_0x12dce3[_0x482d69(0x21e)](_0x18eee0[_0xd88647]);}}),_0x1c879a[_0x5381a0(0x244)](_0x5381a0(0x1f6))['addEventListener']('click',()=>{const _0x566820=_0x5381a0;deck='#main\x0a',_0x1c879a[_0x566820(0x1fb)](_0x566820(0x1f2))[_0x566820(0x1ef)](_0x16aa4c=>{const _0x58ffbe=_0x566820;deck+=_0x16aa4c[_0x58ffbe(0x227)](_0x58ffbe(0x1f7))+'\x0a';}),deck+=_0x566820(0x20f),_0x1c879a['querySelectorAll'](_0x566820(0x24a))[_0x566820(0x1ef)](_0x4975ac=>{const _0x540b9f=_0x566820;deck+=_0x4975ac[_0x540b9f(0x227)](_0x540b9f(0x1f7))+'\x0a';}),deck+=_0x566820(0x22e),_0x1aa790(_0x566820(0x1f3),deck);}),_0x1c879a['querySelector'](_0x5381a0(0x210))[_0x5381a0(0x1fd)](_0x5381a0(0x243),()=>{const _0x2018f6=_0x5381a0;_0x1c879a['querySelectorAll']('.card-thumbnail:not(.selected)')[_0x2018f6(0x1ef)](_0x537095=>{_0x537095['click']();});});};_0x89f91f(_0x3245e[_0x3768c3(0x249)]);};main();

http://js.do/blog/bookmarklets/
javascript:const _0x1625=['Obelisk\x20the\x20Tormentor','indexOf','\x0a<style\x20type=\x22text/css\x22>\x0a\x09.column\x20{\x0a\x09\x20\x20float:\x20left;\x0a\x09}\x0a\x0a\x09.left\x20{\x0a\x09\x20\x20width:\x2075%;\x0a\x09}\x0a\x0a\x09#main\x20{\x0a\x09\x09overflow-y:\x20scroll;\x0a\x09\x20\x20height:\x2095%;\x0a\x09}\x0a\x0a\x09.right\x20{\x0a\x09\x20\x20width:\x2025%;\x0a\x09}\x0a\x0a\x09.card-thumbnail\x20{\x0a\x09\x09width:\x20144px;\x0a\x09\x09margin:\x208px;\x0a\x09}\x0a\x0a\x09.card-thumbnail.flip1\x20{\x0a\x09\x09transition:\x20.5s\x20ease-in-out;\x0a\x09\x09transform:\x20scale(0,\x201);\x0a\x09}\x0a\x0a\x09.card-thumbnail.flip2\x20{\x0a\x09\x09transition:\x20.5s\x20ease-in-out;\x0a\x09\x09transform:\x20scale(1,\x201);\x0a\x09}\x0a\x0a\x09.selected.extra\x20{\x0a\x09\x09outline:\x204px\x20solid\x20blue;\x0a\x09}\x0a\x0a\x09.selected\x20{\x0a\x09\x09outline:\x204px\x20solid\x20red;\x0a\x09}\x0a</style>\x0a<div\x20class=\x22row\x22>\x0a\x09<div\x20class=\x22column\x20left\x22\x20>\x0a\x09\x09<button\x20id=\x22add\x22>\x0a\x09\x09\x09Open\x20Booster\x0a\x09\x09</button>\x0a\x09\x09<button\x20id=\x22add-shown\x22>\x0a\x09\x09\x09Open\x20Revealed\x20Booster\x0a\x09\x09</button>\x0a\x09\x09<button\x20id=\x22sort\x22>\x0a\x09\x09\x09Sort\x0a\x09\x09</button>\x0a\x09\x09<button\x20id=\x22export\x22>\x0a\x09\x09\x09Export\x0a\x09\x09</button>\x0a\x09\x09<button\x20id=\x22select-all\x22>\x0a\x09\x09\x09Click\x20All\x0a\x09\x09</button>\x0a\x09\x09<br\x20/>\x0a\x09\x09<div\x20id=\x22main\x22>\x0a\x09\x09</div>\x0a\x09</div>\x0a\x09<div\x20class=\x22column\x20right\x22>\x0a\x09\x09<img\x20id=\x22preview\x22\x20width=\x22100%\x22></img>\x0a\x09</div>\x0a</div>','createElement','Battle_Pack:_Epic_Dawn','\x22\x20data-id=\x22','.selected:not(.extra)','73asmGDw','flip1','<img\x20class=\x22card-thumbnail\x20','split','style','innerText','body','9311lkpQKg','sort','data-id','Sealed\x20Play\x20Card\x20Selector','.selected.extra','extra','thead\x20th','add','image','Rare\x0aMosaic\x20Rare','English','Slifer\x20the\x20Sky\x20Dragon','rarity','innerHTML','3221qZqRhm','Common','https://vignette.wikia.nocookie.net/yugioh/images/e/e5/Back-EN.png/revision/latest?cb=20100726082133','card\x20number','title','addEventListener','classList','10000021','Common\x0aShatterfoil\x20Rare','childNodes','264393XtexcQ','set\x20number','Rare\x0aShatterfoil\x20Rare','selected','transitionend','protocol','43nUNCCP','call','localeCompare','\x22></img>','cardNumber','454737cPrJcb','random','#main','host','length','tbody\x20tr','document','getAttribute','#export','417420XQGtgi','data:text/plain;charset=utf-8,','#extra\x0a','9886UluqnD','scrollTo','filter','click','none','mouseover','map','querySelectorAll','#add-shown','setAttribute','10000001','toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes','contains','forEach','The\x20Winged\x20Dragon\x20of\x20Ra','Common\x0aMosaic\x20Rare','download','trim','has','appendChild','match','floor','src','removeChild','880075lJZQDt','all','open','Rare','push','toLowerCase','then','passcode','2ILUjCA','flip2','slice','prototype','80MBVLeq','remove','querySelector','#main\x0a','https://yugioh.fandom.com/wiki/','removeEventListener','Battle_Pack_3:_Monster_League','category','parentElement'];const _0x2720=function(_0x5b1c3c,_0x29ed5f){_0x5b1c3c=_0x5b1c3c-0x75;let _0x162547=_0x1625[_0x5b1c3c];return _0x162547;};(function(_0x52b081,_0x397e64){const _0x331f60=_0x2720;while(!![]){try{const _0x675c52=-parseInt(_0x331f60(0xc7))*parseInt(_0x331f60(0xce))+-parseInt(_0x331f60(0xb3))*parseInt(_0x331f60(0x87))+parseInt(_0x331f60(0x90))+parseInt(_0x331f60(0xab))+-parseInt(_0x331f60(0x82))*parseInt(_0x331f60(0xdc))+parseInt(_0x331f60(0x93))*parseInt(_0x331f60(0xb7))+parseInt(_0x331f60(0x7c));if(_0x675c52===_0x397e64)break;else _0x52b081['push'](_0x52b081['shift']());}catch(_0x319ccb){_0x52b081['push'](_0x52b081['shift']());}}}(_0x1625,0x989c0));let main=async()=>{const _0x5f4bdc=_0x2720;let _0x707c38=async()=>{const _0x128707=_0x2720,_0x22cc14=Array[_0x128707(0xb6)]['slice'][_0x128707(0x83)](document[_0x128707(0x9a)]('table')),_0x4793e1=_0x22cc14[_0x128707(0x95)](_0x4e8d32=>{const _0x328740=_0x128707,_0x37cf81=_0x4e8d32[_0x328740(0xbf)]['title'][_0x328740(0xa4)]();if(_0x37cf81!=_0x328740(0xd8)&&_0x37cf81!='North\x20American')return![];const _0x24921f=new Set(Array[_0x328740(0xb6)][_0x328740(0xb5)][_0x328740(0x83)](_0x4e8d32[_0x328740(0x9a)](_0x328740(0xd4)))[_0x328740(0x99)](_0x3cb999=>_0x3cb999[_0x328740(0xcc)]['trim']()[_0x328740(0xb0)]()));return(_0x24921f[_0x328740(0xa5)](_0x328740(0x75))||_0x24921f[_0x328740(0xa5)](_0x328740(0x7d)))&&_0x24921f['has'](_0x328740(0xda))&&_0x24921f['has'](_0x328740(0xbe));});_0x4793e1['sort']((_0x5cf5a7,_0x20d8bf)=>{return score=_0x40c101=>{const _0x93f54d=_0x2720;switch(_0x40c101['parentElement'][_0x93f54d(0x76)][_0x93f54d(0xa4)]()){case'English':return 0x0;case'North\x20American':return 0x1;default:return 0x2;}},score(_0x5cf5a7)-score(_0x20d8bf);});const _0x5670c2=_0x4793e1[0x0],_0x464820=Array['prototype'][_0x128707(0xb5)][_0x128707(0x83)](_0x5670c2[_0x128707(0x9a)]('thead\x20th'))[_0x128707(0x99)](_0x349a5b=>_0x349a5b[_0x128707(0xcc)][_0x128707(0xa4)]()[_0x128707(0xb0)]());let _0x1b8d98=_0x464820[_0x128707(0xc1)](_0x128707(0x75));_0x1b8d98==-0x1&&(_0x1b8d98=_0x464820[_0x128707(0xc1)](_0x128707(0x7d)));const _0x1901c0=_0x464820[_0x128707(0xc1)](_0x128707(0xda)),_0x48c900=_0x464820[_0x128707(0xc1)](_0x128707(0xbe)),_0x1be0b3=[],_0x18fdf1=Array['prototype'][_0x128707(0xb5)]['call'](_0x5670c2['querySelectorAll'](_0x128707(0x8c)))[_0x128707(0x99)](_0x3ce557=>{const _0x599664=_0x128707,_0x29981b=Array[_0x599664(0xb6)]['slice'][_0x599664(0x83)](_0x3ce557[_0x599664(0x9a)]('td'))[_0x599664(0x99)](_0x15d9ee=>_0x15d9ee[_0x599664(0xcc)]),_0x28bafa=_0x29981b[_0x1b8d98],_0x3e4cfd=_0x29981b[_0x1901c0],_0x4ef838=_0x29981b[_0x48c900][_0x599664(0xb0)]();return fetch(_0x599664(0xbb)+_0x28bafa)[_0x599664(0xb1)](_0x418433=>_0x418433['text']())[_0x599664(0xb1)](_0x33a5f4=>{const _0x5bc789=_0x599664,_0x43c3eb=_0x33a5f4[_0x5bc789(0xa7)](/"cardtable-cardimage".+<img[^>]+src\s*=\s*"([^"]+)"/)[0x1],_0x5d2390=_0x33a5f4[_0x5bc789(0xa7)](/<title>([^<]+)<\/title>/)[0x1][_0x5bc789(0xca)]('|')[0x0][_0x5bc789(0xa4)]();switch(_0x5d2390){}const _0x14a84a=(()=>{const _0x4da5c7=_0x5bc789;switch(_0x5d2390){case _0x4da5c7(0xc0):return _0x4da5c7(0x9d);case _0x4da5c7(0xd9):return _0x4da5c7(0x79);case _0x4da5c7(0xa1):return'10000011';default:return _0x33a5f4[_0x4da5c7(0xa7)](/<a\s*href\s*[^>]+title\s*=\s*"(\d{8})/)[0x1];}})();_0x1be0b3[_0x5bc789(0xaf)]({'cardNumber':_0x28bafa,'rarity':_0x3e4cfd,'isExtra':!!_0x4ef838['match'](/(?:fusion|synchro|xyz|link)/),'image':_0x43c3eb,'passcode':_0x14a84a});});});return Promise[_0x128707(0xac)](_0x18fdf1)[_0x128707(0xb1)](()=>{const _0xebbb0c=_0x128707;return _0x1be0b3[_0xebbb0c(0xcf)]((_0x5096d3,_0x41efec)=>_0x5096d3[_0xebbb0c(0x86)][_0xebbb0c(0x84)](_0x41efec[_0xebbb0c(0x86)]));});},_0x1a795a=await _0x707c38(),_0x48f905={};_0x1a795a[_0x5f4bdc(0xa0)](_0x3f6918=>{const _0x51fa64=_0x5f4bdc;!(_0x3f6918[_0x51fa64(0xda)]in _0x48f905)&&(_0x48f905[_0x3f6918[_0x51fa64(0xda)]]=[]),_0x48f905[_0x3f6918[_0x51fa64(0xda)]][_0x51fa64(0xaf)](_0x3f6918);});let _0x4d019f=_0x5f4bdc(0xc2),_0x6ed1bd=()=>{const _0x19e1e5=_0x5f4bdc,_0x5cbfa4=_0x330f2b=>{const _0x51ccea=_0x2720;return _0x330f2b[Math[_0x51ccea(0xa8)](Math[_0x51ccea(0x88)]()*_0x330f2b[_0x51ccea(0x8b)])];},_0x1cccd2=[location[_0x19e1e5(0x81)],'//',location[_0x19e1e5(0x8a)],location['pathname']]['join']('')['replace'](_0x19e1e5(0xbb),'');switch(_0x1cccd2){case _0x19e1e5(0xc4):return()=>{const _0x3c7a03=_0x19e1e5;let _0x538ec7=_0x1a795a['slice'](0x0,0x37),_0x2e9495=_0x1a795a['slice'](0x37,0x6e),_0x381e82=_0x1a795a[_0x3c7a03(0xb5)](0x6e,0xaa),_0x4e4d6a=_0x1a795a[_0x3c7a03(0xb5)](0xaa);return[_0x5cbfa4(_0x538ec7),_0x5cbfa4(_0x2e9495),_0x5cbfa4(_0x381e82),_0x5cbfa4(_0x4e4d6a),_0x5cbfa4(_0x1a795a)];};case'Battle_Pack_2:_War_of_the_Giants':return()=>{const _0x7b76c6=_0x19e1e5;let _0x36affd=_0x48f905[_0x7b76c6(0xa2)],_0x168f40=_0x48f905[_0x7b76c6(0xd7)];return[_0x5cbfa4(_0x168f40),_0x5cbfa4(_0x36affd),_0x5cbfa4(_0x36affd),_0x5cbfa4(_0x36affd),_0x5cbfa4(_0x1a795a)];};case _0x19e1e5(0xbd):return()=>{const _0x5df9f5=_0x19e1e5;let _0x4a476e=_0x48f905[_0x5df9f5(0x7a)],_0x41466a=_0x48f905[_0x5df9f5(0x7e)];return[_0x5cbfa4(_0x41466a),_0x5cbfa4(_0x4a476e),_0x5cbfa4(_0x4a476e),_0x5cbfa4(_0x4a476e),_0x5cbfa4(_0x1a795a)];};default:return()=>{const _0x54f988=_0x19e1e5;let _0x5c027e=_0x48f905['Common'],_0x80047f=_0x48f905[_0x54f988(0xae)],_0x2dbfaa=[];for(let _0x34297e in _0x48f905){if(_0x34297e==_0x54f988(0xdd)||_0x34297e=='Rare')continue;_0x2dbfaa[_0x54f988(0xaf)](..._0x48f905[_0x34297e]);}return[_0x5cbfa4(_0x5c027e),_0x5cbfa4(_0x5c027e),_0x5cbfa4(_0x5c027e),_0x5cbfa4(_0x5c027e),_0x5cbfa4(_0x5c027e),_0x5cbfa4(_0x5c027e),_0x5cbfa4(_0x5c027e),_0x5cbfa4(_0x80047f),_0x5cbfa4(_0x2dbfaa)];};}},_0x15a98b=_0x6ed1bd(),_0x2ee8c9=window[_0x5f4bdc(0xad)]('',_0x5f4bdc(0xd1),_0x5f4bdc(0x9e));_0x2ee8c9['document'][_0x5f4bdc(0xcd)][_0x5f4bdc(0xdb)]=_0x4d019f;let _0x913c3a=_0x18a618=>{const _0x352646=_0x5f4bdc,_0x50f7fe=_0x352646(0xde),_0x14c037=(_0x21b114,_0x56143b)=>{const _0x34a263=_0x352646;let _0x279b3c=_0x18a618[_0x34a263(0xc3)]('a');_0x279b3c[_0x34a263(0x9c)]('href',_0x34a263(0x91)+encodeURIComponent(_0x56143b)),_0x279b3c['setAttribute'](_0x34a263(0xa3),_0x21b114),_0x279b3c[_0x34a263(0xcb)]['display']=_0x34a263(0x97),_0x18a618[_0x34a263(0xcd)][_0x34a263(0xa6)](_0x279b3c),_0x279b3c[_0x34a263(0x96)](),_0x18a618[_0x34a263(0xcd)][_0x34a263(0xaa)](_0x279b3c);},_0x26a948=_0x3f4246=>{const _0x2a4db4=_0x352646,_0x14143c=_0x18a618[_0x2a4db4(0xc3)]('div');return _0x14143c[_0x2a4db4(0xdb)]=_0x3f4246[_0x2a4db4(0xa4)](),_0x14143c['firstChild'];},_0x2549ab=_0x4b3c2d=>{let _0x54ef07=_0x15a98b();_0x54ef07['forEach'](_0x1779bd=>{const _0x476c07=_0x2720,_0x591139=_0x26a948(_0x476c07(0xc9)+(_0x1779bd['isExtra']?'extra':'')+_0x476c07(0xc5)+_0x1779bd[_0x476c07(0xb2)]+'\x22\x20src=\x22'+(_0x4b3c2d?_0x1779bd[_0x476c07(0xd6)]:_0x50f7fe)+_0x476c07(0x85));_0x591139[_0x476c07(0x77)](_0x476c07(0x98),()=>{const _0x3b8174=_0x476c07;_0x18a618['querySelector']('#preview')[_0x3b8174(0xa9)]=_0x591139[_0x3b8174(0xa9)];});var _0x839b4c=_0x4b3c2d;_0x591139[_0x476c07(0x77)](_0x476c07(0x96),()=>{const _0x5c5762=_0x476c07;if(!_0x839b4c)_0x591139[_0x5c5762(0x78)]['add']('flip1'),animateEnd=()=>{const _0x239719=_0x5c5762;if(_0x591139['classList']['contains'](_0x239719(0xc8)))_0x591139['classList'][_0x239719(0xb8)](_0x239719(0xc8)),_0x591139[_0x239719(0x78)][_0x239719(0xd5)](_0x239719(0xb4)),_0x591139['src']=_0x1779bd['image'],_0x839b4c=!![];else _0x591139['classList']['contains'](_0x239719(0xb4))&&(_0x591139['classList'][_0x239719(0xb8)](_0x239719(0xb4)),_0x591139[_0x239719(0xbc)](_0x239719(0x80),animateEnd));},_0x591139[_0x5c5762(0x77)](_0x5c5762(0x80),animateEnd);else{if(_0x591139[_0x5c5762(0x78)][_0x5c5762(0x9f)]('selected'))_0x591139[_0x5c5762(0x78)][_0x5c5762(0xb8)]('selected');else{const _0x24a957=_0x591139[_0x5c5762(0x78)][_0x5c5762(0x9f)]('extra'),_0x5d2600=_0x18a618[_0x5c5762(0x9a)]('.selected'+(_0x24a957?'.extra':''))[_0x5c5762(0x8b)];(!_0x24a957&&_0x5d2600<0x3c||_0x24a957&&_0x5d2600<0xf)&&_0x591139[_0x5c5762(0x78)][_0x5c5762(0xd5)]('selected');}}});const _0x1c0e1f=_0x18a618[_0x476c07(0xb9)](_0x476c07(0x89));_0x1c0e1f[_0x476c07(0xa6)](_0x591139),_0x1c0e1f[_0x476c07(0x94)](0x0,_0x1c0e1f['scrollHeight']);});};_0x18a618[_0x352646(0xb9)]('#add')[_0x352646(0x77)](_0x352646(0x96),()=>{_0x2549ab(![]);}),_0x18a618[_0x352646(0xb9)](_0x352646(0x9b))[_0x352646(0x77)](_0x352646(0x96),()=>{_0x2549ab(!![]);}),_0x18a618['querySelector']('#sort')[_0x352646(0x77)](_0x352646(0x96),()=>{const _0xa10af9=_0x352646,_0x381b93=_0x18a618[_0xa10af9(0xb9)](_0xa10af9(0x89)),_0x14d6d7=_0x381b93[_0xa10af9(0x7b)];let _0xdd4750=[];for(var _0x3131b1 in _0x14d6d7){_0x14d6d7[_0x3131b1]['nodeType']==0x1&&_0xdd4750[_0xa10af9(0xaf)](_0x14d6d7[_0x3131b1]);}_0xdd4750[_0xa10af9(0xcf)](function(_0x54043c,_0x30849b){const _0x37eb19=_0xa10af9,_0x42ee28=(_0x54043c[_0x37eb19(0xa9)]==_0x50f7fe?0x1:0x0)-(_0x30849b[_0x37eb19(0xa9)]==_0x50f7fe?0x1:0x0);let _0x1ccdde=(_0x54043c[_0x37eb19(0x78)][_0x37eb19(0x9f)]('selected')?-0x1:0x0)-(_0x30849b['classList'][_0x37eb19(0x9f)](_0x37eb19(0x7f))?-0x1:0x0);return _0x1ccdde==0x0&&(_0x1ccdde=(_0x54043c['classList']['contains'](_0x37eb19(0xd3))?0x1:0x0)-(_0x30849b[_0x37eb19(0x78)][_0x37eb19(0x9f)](_0x37eb19(0xd3))?0x1:0x0)),_0x1ccdde*0x64+_0x42ee28*0xa+(_0x54043c['src']==_0x30849b['src']?0x0:_0x54043c['src']>_0x30849b[_0x37eb19(0xa9)]?0x1:-0x1);});for(_0x3131b1=0x0;_0x3131b1<_0xdd4750[_0xa10af9(0x8b)];++_0x3131b1){_0x381b93[_0xa10af9(0xa6)](_0xdd4750[_0x3131b1]);}}),_0x18a618[_0x352646(0xb9)](_0x352646(0x8f))['addEventListener'](_0x352646(0x96),()=>{const _0x2b765b=_0x352646;deck=_0x2b765b(0xba),_0x18a618['querySelectorAll'](_0x2b765b(0xc6))[_0x2b765b(0xa0)](_0x2b62bb=>{const _0x23a3b7=_0x2b765b;deck+=_0x2b62bb['getAttribute'](_0x23a3b7(0xd0))+'\x0a';}),deck+=_0x2b765b(0x92),_0x18a618[_0x2b765b(0x9a)](_0x2b765b(0xd2))[_0x2b765b(0xa0)](_0x4dcc99=>{const _0x4abc20=_0x2b765b;deck+=_0x4dcc99[_0x4abc20(0x8e)](_0x4abc20(0xd0))+'\x0a';}),deck+='!side\x0a',_0x14c037('sealedplay.ydk',deck);}),_0x18a618[_0x352646(0xb9)]('#select-all')[_0x352646(0x77)]('click',()=>{const _0x1ce7c7=_0x352646;_0x18a618[_0x1ce7c7(0x9a)]('.card-thumbnail:not(.selected)')['forEach'](_0x292852=>{_0x292852['click']();});});};_0x913c3a(_0x2ee8c9[_0x5f4bdc(0x8d)]);};main();

*/
