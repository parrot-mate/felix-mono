## for node.js project ( use node v20 )

FROM node:20


WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

RUN npm install -g typescript

COPY . .

RUN tsc

EXPOSE 5788 

# Step 7: Define the command to run your app using CMD which defines your runtime. Here we will use node server.js to start your server
CMD ["node", "dist/index.js"]
