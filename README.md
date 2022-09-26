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
- `BASE_URL_IMG` base url + /img/ example: http://example.com/img/

## API call 

### `method : GET`

- `/` return server status
- `/img` return all image data
- `/img/<file_name>` return image

### `method : POST`

- `/auth/signin`
	- params : user , password
	- return : `status 201` if success or `status 400` if error
- `/auth/signup`
	- params : user , password
	- return : `status 201` if success or `status 400` if error
- `/auth/test`
	- test json web token
	- header 'jwt' required
	- return `status 200 && token` if success or `status 400` if error
- `/img/upload`
	- params : image file
	- return `status 201` if upload success or `status 404` if file not found

### `method : PUT`

### `method : DELETE`

## Learn More

To learn more about Express.js, take a look at the following resources:

- [Express.js Documentation](https://expressjs.com/en/5x/api.html) - learn about Express.js features and API.

- [Learn Express.js](https://www.w3schools.com/nodejs/default.asp) - an interactive Next.js tutorial.
