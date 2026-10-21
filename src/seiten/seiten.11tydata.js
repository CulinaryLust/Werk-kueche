export default {
  layout: "seite.njk",
  eleventyComputed: {
    permalink: (data) => `/${data.slug}/`,
  },
};
