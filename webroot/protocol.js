/*
*	Protokoll f�r att styra speglarna
*	
*	struktur:
*     { 'protocolId1':  <- tex leftMirror
*		{
*			'moveX': 'X', <- widget s�nder kommando1 men ut p� picaxekabeln kommer det A 
*			'moveY': 'Y', <- skickar B
*			'blink': 'L'  <- v�nsterblink
*		},
*		'protocolId2': <- tex rightMirror
*		{  
*			'blink': 'x', <- notera sm� bokst�ver
*			'moveX': 'y',
*			'blink': 'T'
* 	    }
*	  }
*
*		P� detta vis kan samma widgetClass anv�nda samma API,
*		men s�nda olika kommandon beroende p� vilken protocolID som den skapats med
*
*			OBS alla dessa nycklar eller ID finns dokumenterade i filen protokollnycklar.txt
*/

{
	leftMirror: {
		moveX: 'Y',		// flytta X, 1=ned, 0=upp
		moveY: 'X', 	// flytta Y, 1=v�nster, 0=h�ger
		cancel:'Q',		// avbryt flytt
		fold: 'Z', 		// F�ll in eller ut spegel 1=ut, 0 = in
		blinker: '<', 	// blinkljus 1= p�, 0=av
		flasher:  'F',   // flasher
		safeLight: 'P', // trygghetsljus 1=p�, 0=av
		Xpos: 'W0',	    // h�mta Xpos (upp-ned)
		Ypos: 'W1',		// h�mta Ypos (v�nster-h�ger)
		getTemp: 'W2',  // h�mta temperaturv�rde
		defroster: 'S'	// defroster av=0 eller p�=1 
	},
	rightMirror: {
		moveX: 'U',		// flytta X, 1=ned, 0=upp
		moveY: 'V', 	// flytta Y, 1=v�nster, 0=h�ger
		cancel:'Q',		// avbryt flytt
		fold: 'Z', 		// F�ll in eller ut spegel 1=ut, 0 = in
		blinker: '>', 	// blinkljus 1= p�, 0=av
		flasher:  'F',   // flasher
		safeLight: 'P', // trygghetsljus 1=p�, 0=av
		Xpos: 'T0',	    // h�mta Xpos (upp-ned)
		Ypos: 'T1',		// h�mta Ypos (v�nster-h�ger)
		getTemp: 'T2',   // h�mta temperaturv�rde
		defroster: 'S'	// defroster av=0 eller p�=1 
	},
	leftHeadlamp: {
		highBeam: 'H',   // heljus
		lowBeam:  'L',	 // halvljus
		parkLight:'@',	 // parkeringsljus
		blinker:  '<',   // blinkers
		flasher:  'F',   // flasher
		angle:    'M'	 // ljusl�ngdsvinkel
	},
	rightHeadlamp: {
		highBeam: 'H',   // heljus
		lowBeam:  'L',	 // halvljus
		parkLight:'@',	 // parkeringsljus
		blinker:  '>',   // blinkers
		flasher:  'F',   // flasher
		angle:    'M'    // ljusl�ngdsvinkel
	},
	leftRearLamp: {
		parkLight: '@', // parkering
		brakeLight:'=', // bromsljus
		blinker:   '<', // blinkers
		flasher:  'F',   // flasher
		backingLight:  'R'  // backljus
	},	
	rightRearLamp: {
		parkLight: '@', // parkering
		brakeLight:'=', // bromsljus
		blinker:   '>', // blinkers
		flasher:  'F',   // flasher
		backingLight:  'R'  // backljus
	},
	dashBoard: {
		beeper:    'I',  // Signalhorn
		leftBlink: '<',  // v�nsterblinkers
		rightBlink:'>',  // h�gerblinkers
		flasher:   'F',  // flasher
		highBeam:  'H',   // helljus
		lowBeam:   'L',	 // halvljus
		backingLight:  'R', // backljus
		safeLight: 'P', // trygghetsljus 1=p�, 0=av
		defroster: 'S', // defroster av=0 eller p�=1 
		parkLight: '@', // parkering
		brakeLight:'=',  // bromsljus
                speed:     's', // speed
                rpm:       'r'  // engine rpm
	},
	horn: {
		beeper:    'I'  // Signalhorn
    },
    gearSelector: {
        gear:      'R'  // v�xel, 0=netrual, 1=reverse, 2=drive
    }
}
