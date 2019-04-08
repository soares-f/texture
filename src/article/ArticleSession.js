import { DocumentSession } from 'substance'
import FigureManager from './shared/FigureManager'
import FootnoteManager from './shared/FootnoteManager'
import FormulaManager from './shared/FormulaManager'
import ReferenceManager from './shared/ReferenceManager'
import TableManager from './shared/TableManager'
import SupplementaryManager from './shared/SupplementaryManager'

export default class ArticleSession extends DocumentSession {
  constructor (doc, config) {
    super(doc)

    let articleConfig = config.get('article')

    this.figureManager = new FigureManager(this, articleConfig.get('label-generator:figures'))
    this.footnoteManager = new FootnoteManager(this, articleConfig.get('label-generator:footnotes'))
    this.formulaManager = new FormulaManager(this, articleConfig.get('label-generator:formulas'))
    this.referenceManager = new ReferenceManager(this, articleConfig.get('label-generator:references'))
    this.supplementaryManager = new SupplementaryManager(this, articleConfig.get('label-generator:supplementaries'))
    this.tableManager = new TableManager(this, articleConfig.get('label-generator:tables'))
  }

  getFigureManager () {
    return this.figureManager
  }

  getFootnoteManager () {
    return this.footnoteManager
  }

  getFormulaManager () {
    return this.formulaManager
  }

  getReferenceManager () {
    return this.referenceManager
  }

  getTableManager () {
    return this.tableManager
  }

  getSupplementaryManager () {
    return this.supplementaryManager
  }
}
