This web application using [Express.js](https://expressjs.com/) and [MongoDB Atlas](https://www.mongodb.com/atlas/database)

## Getting Started

First, git clone and deploy on [Vercel](https://vercel.com/) then Integration [MongoDB Altas](https://vercel.com/integrations/mongodbatlas) to your project.

## Base URL

`https://bookstore-back-end-1jz3.vercel.app/`
[Link here](https://bookstore-back-end-1jz3.vercel.app/)

## local.env

all environment variables you need

- `TOKEN_KEY` for Jsonwebtoken
- `MONGODB_URL` mongodb or mongodb atlas url
- `DB_NAME` database name

## RESTful API

### `method : GET`

- `/` return server status
- `/product/allSeries` return all series
- `/series/<seriesId>` return specific series details ( contain all product in series )
- `/series/<productURL>` return specific product details
- `/latestProduct` return latest product

### `method : POST`

- `/auth/signin`
	- params : user , password
- `/auth/signup`
	- params : user , password
- `/auth/test`
	- test json web token
	- header 'jwt' required
	- return `token` 
- `/admin/addSeries`
	- add series
	- header 'jwt' with role admin required
- `/admin/addProduct`
	- add product 
	- header 'jwt' with role admin required
- `/admin/reCalculateCos`
	- re calculate CosineSimilarity table
	- header 'jwt' with role admin required

### `method : PUT`

### `method : DELETE`

## Learn More

To learn more about Express.js, take a look at the following resources:

- [Express.js Documentation](https://expressjs.com/en/5x/api.html) - learn about Express.js features and API.

- [Learn Express.js](https://www.w3schools.com/nodejs/default.asp) - an interactive Next.js tutorial.