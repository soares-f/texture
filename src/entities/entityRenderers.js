// ${source} (${edition}). ${authors}. [ ${editors}, editors.] (${year}) ${publisher-loc}: ${publisher}.
function bookCitationRenderer($$, entityId, entityDb) {
  let entity = entityDb.get(entityId)
  let fragments = []

  // We render an annotated chapter title here:
  fragments.push(
    _renderHTML($$, entity.chapterTitle)
  )
  fragments.push('. ', entity.source)
  fragments.push(' (', entity.edition, ').')
  if (entity.authors.length > 0) {
    fragments = fragments.concat(
      _renderAuthors($$, entity.authors, entityDb)
    )
  }
  if (entity.editors.length > 0) {
    fragments = fragments.concat(
      _renderAuthors($$, entity.editors, entityDb)
    )
  }
  return fragments
}

function personRenderer($$, entityId, entityDb) {
  let { givenNames, surname } = entityDb.get(entityId)
  return [
    givenNames,
    ' ',
    surname
  ]
}

function organisationRenderer($$, entityId, entityDb) {
  let { name } = entityDb.get(entityId)
  return [
    name
  ]
}

/*
  Exports
*/
export default {
  'person': personRenderer,
  'book-citation': bookCitationRenderer,
  'organisation': organisationRenderer
}

/*
  Helpers
*/
function _renderAuthors($$, entityIds, entityDb) {
  let fragments = [' ']
  entityIds.forEach((personId, i) => {
    fragments = fragments.concat(
      personRenderer($$, personId, entityDb)
    )
    if (i < entityIds.length - 1) {
      fragments.push(', ')
    }
  })
  fragments.push('.')
  return fragments
}

function _renderHTML($$, htmlString) {
  return $$('span').html(htmlString)
}
