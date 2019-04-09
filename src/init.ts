import { initDb } from './db/postgre';

console.log('Init database...');

initDb(false, true, true).then(() => {
	console.log('Done :)');
}, e => {
	console.error('Failed to init database');
	console.error(e);
});
