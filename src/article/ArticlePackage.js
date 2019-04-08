import ArticlePanel from './ArticlePanel'
import ManuscriptEditor from './editor/ManuscriptEditor'
import ManuscriptPackage from './editor/EditorPackage'
import MetadataEditor from './metadata/MetadataEditor'
import MetadataPackage from './metadata/MetadataPackage'
import FigureLabelGenerator from './shared/FigureLabelGenerator'
import NumberedLabelGenerator from './shared/NumberedLabelGenerator'
import ArticleHTMLConverters from './converter/html/ArticleHTMLConverters'
import EntityLabelsPackage from './shared/EntityLabelsPackage'

export default {
  name: 'article',
  configure (config) {
    // register ArticlePanel on the Texture configuration level
    config.addComponent('article', ArticlePanel)

    let articleConfig = config.createScope('article')
    articleConfig.addComponent('manuscript-editor', ManuscriptEditor)
    articleConfig.addComponent('metadata-editor', MetadataEditor)

    articleConfig.import(EntityLabelsPackage)

    // enable rich-text support for clipboard
    ArticleHTMLConverters.forEach(converter => {
      articleConfig.addConverter('html', converter)
    })

    // ATTENTION: FigureLabelGenerator works a bit differently
    // TODO: consolidate LabelGenerators and configuration
    // e.g. it does not make sense to say 'setLabelGenerator' but then only provide a configuration for 'NumberedLabelGenerator'
    articleConfig.set('label-generator:figures', new FigureLabelGenerator({
      singular: 'Figure $',
      plural: 'Figures $',
      and: ',',
      to: '-'
    }))
    articleConfig.set('label-generator:footnotes', new NumberedLabelGenerator({
      template: '$',
      and: ',',
      to: '-'
    }))
    articleConfig.set('label-generator:formulas', new NumberedLabelGenerator({
      template: '($)',
      and: ',',
      to: '-'
    }))
    articleConfig.set('label-generator:references', new NumberedLabelGenerator({
      template: '[$]',
      and: ',',
      to: '-'
    }))
    articleConfig.set('label-generator:supplementaries', new NumberedLabelGenerator({
      name: 'Supplementary File',
      plural: 'Supplementary Files',
      and: ',',
      to: '-'
    }))
    articleConfig.set('label-generator:tables', new NumberedLabelGenerator({
      name: 'Table',
      plural: 'Tables',
      and: ',',
      to: '-'
    }))

    // config for ManuscriptView
    let manuscriptConfig = config.createScope('article.manuscript')
    // TODO: move everything shared across article related views into commons
    manuscriptConfig.import(ManuscriptPackage)

    let metadataConfig = config.createScope('article.metadata')
    // TODO: move everything shared across article related views into commons
    metadataConfig.import(MetadataPackage)
  }
}
