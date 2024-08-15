import { demoServer } from './common.ts'

describe('writeOverlappingSegmentation', () => {
  beforeEach(function() {
    cy.visit(demoServer)

    const testPathPrefix1 = '../test/data/input/dicom-images/'
    const testPathPrefix2 = '../emscripten-build/_deps/dcmqi_lib-src/'

    // Read the input file
    const inputFile = 'SEG/overlapping/overlapping-seg.nrrd'
    const inputFilePath = `${testPathPrefix1}${inputFile}`
    cy.readFile(inputFilePath, null).as('inputFile')

    const metaInfoFile = 'doc/examples/seg-example_partial_overlaps.json'
    const metaInfoFilePath = `${testPathPrefix2}${metaInfoFile}`
    cy.readFile(metaInfoFilePath, null).as('metaInfoFile')//.should('not.equal', null)

    const refFiles = [
      'data/segmentations/ct-3slice/01.dcm',
      'data/segmentations/ct-3slice/02.dcm',
      'data/segmentations/ct-3slice/03.dcm',
    ]
    cy.readFile(`${testPathPrefix2}${refFiles[0]}`, null).as('ref0.dcm')
    cy.readFile(`${testPathPrefix2}${refFiles[1]}`, null).as('ref1.dcm')
    cy.readFile(`${testPathPrefix2}${refFiles[2]}`, null).as('ref2.dcm')
  })

  it('writes a segmentation image to a dicom file', function () {
    cy.get('sl-tab[panel="writeOverlappingSegmentation-panel"]').click()

    cy.get('#writeSegmentationInputs input[name=seg-image-file]').selectFile({ contents: new Uint8Array(this.inputFile), fileName: 'inputData.nrrd' }, { force: true })
    cy.get('#writeSegmentationInputs input[name=meta-info-file]').selectFile({ contents: new Uint8Array(this.metaInfoFile), fileName: 'inputData.json' }, { force: true })

    cy.get('#writeSegmentationInputs sl-input[name=output-dicom-file]').find('input', { includeShadowDom: true }).type('output_write_segmentation.dcm', { force: true }) 
    //cy.get('#niftiWriteImageInputs sl-input[name="serialized-image"]').find('input', { includeShadowDom: true }).type('r16slice.nii.gz', { force: true })
    //cy.get('#writeSegmentationInputs input[name="output-dicom-file"]').type('output_tumor_seg_MR_ref_3DSAGT2SPACE.dcm')

    const inputFiles = []
    for(let i = 0; i < 3; i++) {
      inputFiles.push({ contents: new Uint8Array(this[`ref${i}.dcm`]), fileName: `ref${i}.dcm` })
    }
    cy.get('#writeSegmentationInputs input[name="ref-dicom-series-file"]').selectFile( inputFiles, { force: true })

    // need to click twice for some reason `\/O\/`
    cy.get('#writeSegmentationInputs sl-button[name="run"]').click()
    cy.get('#writeSegmentationInputs sl-button[name="run"]').click()

    cy.get('#writeOverlappingSegmentation-seg-image-details').should('exist')
    cy.get('#writeOverlappingSegmentation-output-dicom-file-details').should('exist')
    cy.get('#writeOverlappingSegmentation-output-dicom-file-details').should('contain', '0,0,0,0,0,0,0,0,0,0,0,')
    //cy.get('#writeOverlappingSegmentation-meta-info-details').should('contain', '"labelID": 1')
    //cy.get('#writeOverlappingSegmentation-meta-info-details').should('contain', '"BodyPartExamined": "BRAIN"')
  })
})
