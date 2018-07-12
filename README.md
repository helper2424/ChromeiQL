# ChromeiQL

Making the great [GraphiQL tool](https://github.com/graphql/graphiql/) available anywhere as a Chrome extension.

Based on the [GraphiQL example code](https://github.com/graphql/graphiql/tree/master/example).

With option to add headers. Header format is JSON or "HEADER_NAME:HEADER_VALUE;"

## How to use locally

Clone repository:
  ```
    git clone https://github.com/helper2424/ChromeiQL.git
  ```

Build last version of the extenstion:
```
yarn installl
webpack
```

If everything is ok and extension build succesfully you could install extension to your browser. Open `chrome://extensions/`
in chrome browser. Enable developer mode. Upload directory with extensions to the browser. Now you could use it.