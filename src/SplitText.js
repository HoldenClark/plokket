export function splitTextAnimate({htmlElement: htmlElement, transitionDuration: transitionDuration, animateOffset: animateOffset, inputWidthOfSpace: inputWidthOfSpace, isUpwardAnimation: isUpwardAnimation}) {
    // TODO: group chars by word and place whole new word on next row if it doesn't fit
    // TODO: may have to do some calc on line-height w/ font-size to get correct clipping of tails
    //  ^^ TODO: may have to calc whether all chars are upper before that calculation
    // TODO: data validation make sure param inputs can't break function
    // TODO: fix how row height is calculated for larger font sizes
    // TODO: fix multiple function call usage simultaneous

    const elemId = htmlElement.id;

    // create default values for unusued params
    // htmlElement input is non-optional
    if (transitionDuration == null) {
        transitionDuration = "0.25";
    }

    if (animateOffset == null) {
        animateOffset = 20;
    }

    if (inputWidthOfSpace == null) {
        inputWidthOfSpace = 4; // 3..6 {3: 1em, 4: 1/3em, 5: 1/4em, 6: 1/6em} width of space char
    } else {
        // convert user input space options {0..3} => {3..6} for codepoint generation
        // user input map: 0 => 3/1em, 1 => 4/.33em, 2 => 5/.25em, 3 => 6/.1667em
        inputWidthOfSpace %= 4;
        inputWidthOfSpace += 3; 
    }

    let translateVal;
    if (isUpwardAnimation == null || isUpwardAnimation) {
        translateVal = "translate(0, 100%)";
    } else {
        translateVal = "translate(0, -100%)";
    }


    // create code point and generate val for space
    let spaceCodePoint = "0x" + parseInt(`200${inputWidthOfSpace}`); 
    widthOfSpace = String.fromCodePoint(spaceCodePoint);
   



    // grab initial data about input element
    const parentElemData = htmlElement.getBoundingClientRect();
    const parentElemHeight = parentElemData.height;
    const parentElemWidth = parentElemData.width;
    const parentElemText = htmlElement.innerText;

    // set element input style to display chars in row form if not set to do so by default
    htmlElement.style.display = "flex";
    htmlElement.style.flexDirection = "column";
    htmlElement.style.lineHeight = "normal"

    // remove old text and any other children elements, leaves us with blank canvas
    htmlElement.innerText = "";
    htmlElement.replaceChildren();





    let combinedCharWidth = 0;
    let maxCharHeight = 0;
    
    // create array to store char widths so that when can know their width before we add them to the DOM the 2nd time
    let arrayOfCharWidths = [];

    // create array to store word withs so that we can calc for word wrap, k for incrementing to start calc width of next word
    let arrayOfWordWidths = [0];
    let k = 0;
    let spaceHtmlElementWidth;

    // create elements for each char so we can animate them individually later
    const charVals = parentElemText.split('');
    for (let charVal of charVals) {
        let charElem = document.createElement("div");
        
        if (charVal == ' ') {
            charElem.innerText = `${widthOfSpace}`;
        } else {
            charElem.innerText = charVal;
        }
        charElem.classList.add(`special-animate-tag-${elemId}`);
        charElem.style.visibility = "hidden";
        charElem.style.width = "fit-content";
        charElem.style.height = "fit-content";
        htmlElement.appendChild(charElem);
    

        let charData = charElem.getBoundingClientRect();
        let charWidth = charData.width;
        let charHeight = charData.height;

        if (charVal == ' ') {
            ++k;
            arrayOfWordWidths.push(0);
            spaceHtmlElementWidth = charWidth;
        } else {
            arrayOfWordWidths[k] += charWidth;
        }

        combinedCharWidth += charWidth;
        maxCharHeight = Math.max(charHeight, maxCharHeight);
        arrayOfCharWidths.push(charWidth);
    }

    console.log(maxCharHeight);
    console.log(arrayOfWordWidths);

    let numOfWords = arrayOfWordWidths.length;
    
    // remove char elems just created to calculate dimensions
    htmlElement.replaceChildren();
   

    // calculate total number of rows so we can wrap text within our parent elem 
    //let numberOfRows = Math.ceil(combinedCharWidth / parentElemWidth);
    let numberOfRows = 1;
    let currRowWidth = 0;
    for (let i = 0; i < arrayOfWordWidths.length; ++i) {
        if (currRowWidth + arrayOfWordWidths[i] + spaceHtmlElementWidth < parentElemWidth) {
            currRowWidth += (arrayOfWordWidths[i] + spaceHtmlElementWidth);
        } else if (currRowWidth + arrayOfWordWidths[i] < parentElemWidth) {
            currRowWidth += arrayOfWordWidths[i];
            ++numberOfRows;
            currRowWidth = 0;
        } else {
            ++numberOfRows;
            if (arrayOfWordWidths[i] + spaceHtmlElementWidth < parentElemWidth) { 
                currRowWidth = arrayOfWordWidths[i] + spaceHtmlElementWidth;
            } else if (arrayOfWordWidths[i] < parentElemWidth) {
                currRowWidth = arrayOfWordWidths[i];
            } 
            // TODO: if above falls then cannot successfully word wrap and will need to shrink font-size and start again
        }
    }

    console.log(numberOfRows);
    console.log(arrayOfCharWidths);

    let arrayOfRows = [];

    for (let i = 0; i < numberOfRows; i++) {
        let rowElem = document.createElement("div");
        rowElem.style.boxSizing = "border-box";
        //rowElem.style.border = "1px solid hotpink"; //debug statement
        rowElem.style.width = parentElemWidth + "px";
        rowElem.style.height = maxCharHeight + "px";
       
        rowElem.style.display = "flex";
        rowElem.style.flexDirection = "row";

        // hide elements not animated yet
        rowElem.style.overflow = "hidden";
 
        arrayOfRows.push(rowElem);
        htmlElement.appendChild(rowElem);
    }

    const newElems = document.querySelectorAll(`.special-animate-tag-${elemId}`);




    // add char elements back but now in correct row
    let currentTotalWidth = 0;
    let currentRow = 0;
    let i = 0;
    let currWord = 0;
    let nextCharSpace = false;
    for (let k = 0; k < charVals.length; ++k) {
        let charElem = document.createElement("div");
        let charVal = charVals[k];
        if (k != charVals.length && charVals[k + 1] == ' ') {
            nextCharSpace = true;
        } else {
            nextCharSpace = false
        }

        if (charVal == ' ') {
            charElem.innerText = `${widthOfSpace}`;
            ++currWord;
        } else {
            charElem.innerText = charVal;
        }
        charElem.classList.add(`special-animate-tag-${elemId}`);
        charElem.style.width = "fit-content";
        charElem.style.height = "fit-content";
        charElem.style.transform = `${translateVal}`;
   
 
        // USED BEFORE ADJUSTED FOR WORD-WRAP
        //if (arrayOfCharWidths[i] + currentTotalWidth > parentElemWidth) {
        //    currentRow += 1;
        //    currentTotalWidth = 0;
        //    // don't start a row with a space char
        //    if (charVal == ' ') {continue;}
        //}

        if (currentTotalWidth == 0 && charVal == ' ') {
            ++i; //remember to increment to next charVal even if not adding this char
            continue;
        }

        currentTotalWidth += arrayOfCharWidths[i];
        console.log(currWord, arrayOfWordWidths[currWord], charVal, currentTotalWidth, parentElemWidth); 
        arrayOfRows[currentRow].appendChild(charElem);
        ++i;
        
        // if next char is a space then we know we are starting a new word and check if it fits on row, do this after we already add the last char from the curr word because we are incrementing the row to append to if this check passes
        if (arrayOfWordWidths[currWord + 1] + currentTotalWidth + spaceHtmlElementWidth > parentElemWidth && nextCharSpace) {
            ++currentRow;
            currentTotalWidth = 0;
        }
    }
   
    const charElems = document.querySelectorAll(`.special-animate-tag-${elemId}`);
    let j = 0;
    for (let charElem of charElems) {
        setTimeout(() => {
            charElem.style.transform = "translate(0, 0)";
            charElem.style.transitionDuration = `${transitionDuration}s`;
        }, 10 + j);
        j += animateOffset;
    }
}
