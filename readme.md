# Ravelry Designer Site
This is a demo to run a dynamic website yourself that gets all the information form your Ravelry Store.

You will need an API key (find out more at https://www.ravelry.com/pro/developer) 
but once you have, you can remix this site, edit the `.env` file, and it will work exactly the same as this but with your information.

`DESIGNER_NAME` is the plain text value you want to use, all other variables relate to your Ravelry Store.

The layout is deliberately raw, using basic properties available from Ravelry data.

Links to Products (Patterns) is funky and could do with more work.

# Tech stack
* node (latest Glitch allows)
* fastify web framework
* PugJS for templating
* Bootstrap for style
* jQuery and DataTables for interactive Patterns list
* Gulp for build and folder structure
* Ravelry NPM library simplifies auth and access

# TODO
Currently the asset and header image are hard coded.