// import updateEntityChildArray from '../shared/updateEntityChildArray'
import AbstractCitationManager from './AbstractCitationManager'

const referenceTypes = [
  'journal-article', 'book', 'chapter', 'conference-paper',
  'report', 'newspaper-article', 'magazine-article', 'data-publication',
  'patent', 'webpage', 'thesis', 'software'
]

export default class ReferenceManager extends AbstractCitationManager {
  constructor (doc, labelGenerator) {
    super(doc, 'bibr', labelGenerator)
    // compute initial labels
    this._updateLabels()
  }

  // TODO: don't do this here, instead add something like this to ArticleAPI
  updateReferences (newRefs) { // eslint-disable-line no-unused-vars
    console.error('FIXME: do not update references here, use the ArticleAPI instead')
    // let refList = this.doc.find('ref-list')
    // let oldRefs = this.getReferenceIds()
    // this.articleSession.transaction(tx => {
    //   updateEntityChildArray(tx, refList.id, 'ref', 'rid', oldRefs, newRefs)
    // })
  }

  getReferenceIds () {
    let doc = this.doc
    let refs = doc.findAll('ref-list > ref')
    return refs.map(ref => ref.getAttribute('rid'))
  }

  /*
    Returns a list of formatted citations including labels
  */
  getBibliography () {
    let references = this._getReferences()
    references.sort((a, b) => {
      return a.state.pos - b.state.pos
    })
    return references
  }

  getAvailableResources () {
    return this.getBibliography()
  }

  _getReferences () {
    const doc = this.doc
    const refs = referenceTypes.reduce((refs, type) => {
      return refs.concat(doc.findByType(type))
    }, [])
    const refsOrder = this._getReferencesOrder()
    return refs.map(r => {
      const index = refsOrder.indexOf(r.replace('@',''))
      return {
        state: {
          entity: doc.get(r),
          pos: index > -1 ? index : 9999
        }
      }
    })
  }

  // Determine order based on citations in the document
  _getReferencesOrder() {
    const doc = this.doc
    const xrefs = doc.findAll('xref[ref-type=bibr]')
    return xrefs.reduce((refs, xref) => {
      const ref = xref.getAttribute('rid')
      ref.split(' ').forEach(r => {
        if(refs.indexOf(r) === -1) {
          refs.push(r)
        }
      })
      return refs
    }, [])
  }
}
