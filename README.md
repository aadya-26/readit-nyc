# ReadIt NYC

An interactive 3D map of how New Yorkers feel about their neighborhoods, built from public r/nyc posts. Each sphere is one post: color is sentiment, height is emotional intensity plus engagement, size is engagement.

Built with React, Vite, deck.gl and a Carto basemap. Sentiment was scored with a RoBERTa model (cardiffnlp/twitter-roberta-base-sentiment-latest).

## Data

`public/data/reddit_posts_clean.csv` holds 438 posts, with no usernames and body text capped at 600 characters. Posts link back to Reddit. Content belongs to its authors and Reddit.

## Run locally

    npm install
    npm run dev

Map tiles © CARTO, © OpenStreetMap contributors.
