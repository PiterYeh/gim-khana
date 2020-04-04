import React from 'react';

const translations = {
	it: {
		name: 'Nome',
		delete: 'Rimuovi',
		'new': 'Nuovo',
		save: 'Salva',
		titleExercises: 'Esercizi',
		titleMyRoutines: 'Schede',
		exerciseTitle: 'Titolo',
		exerciseSubtitle: 'Sottotitolo',
		go: 'Vai',
		choose: 'Scegli'
	},
	en: {
		name: 'Name',
		delete: 'Delete',
		'new': 'New',
		save: 'Save',
		titleExercises: 'Exercises',
		titleMyRoutines: 'My Routines',
		exerciseTitle: 'Title',
		exerciseSubtitle: 'Subtitle',
		go: 'Go',
		choose: 'Choose'
	}
};

function getTranslation(langTranslations, name) {
	var translation = langTranslations[name];
	if(translation == null)
		return `{${name}}`;
	return translation;
}

const context = React.createContext();

export {
	translations,
	getTranslation,
	// getCurrentLanguage,
	// setCurrentLanguage,
	context
};