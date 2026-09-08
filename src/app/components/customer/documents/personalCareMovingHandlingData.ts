import type { FormField } from '../CareBridgePage';

// "Personal Care / Moving and Handling" — content taken from a real example
// of this assessment (originally for a different customer; renamed to
// Arthur for this demo, same as WIITM's own real-example provenance). Given
// to Arthur in place of the full 16-section Care & Support Plan — that's the
// customer's largest, most structurally complex document, which read as too
// busy for a quick demo of the review flow. This is a single, focused
// document instead: no left-hand section nav, same "genuinely one page" shape
// as WhatIsImportantToMeDocumentPage.
//
// Fields the source example actually had answers for are pre-filled and
// `reviewed: false` (an AI draft awaiting review, same convention as
// everywhere else); fields it left blank stay blank ("Not yet captured"),
// same honest-gaps approach as every other drafted document in this app —
// not invented to look more complete than the real example was.
//
// `sourceLines` trace each captured field back to Claire's actual words in
// ARTHUR_PERSONAL_CARE_TRANSCRIPT (CareBridgePage.tsx) — added once that
// transcript existed to record, so "Check transcript" has something real to
// point at rather than a drafted field with nowhere to trace back to.
export const PERSONAL_CARE_FIELDS: FormField[] = [
  {
    id: 'washing', label: 'Washing', type: 'text', reviewed: false,
    value: "Arthur can manage most washing at the sink himself. He cannot twist round to wash his own back, so the carer needs to do that part.",
    sourceLines: [{ index: 4, highlight: "I can't twist round to do it myself anymore, so whoever's helping me needs to do that bit." }],
  },
  {
    id: 'bathing', label: 'Bathing', type: 'text', reviewed: false,
    value: 'Arthur likes a bath on Sundays. He needs help getting in and out of the bath. Getting up is particularly difficult. Someone also needs to wash his back.',
    sourceLines: [
      { index: 6, highlight: 'I like a bath on a Sunday' },
      { index: 8, highlight: "I need help getting in and out of it, it's the getting up again that's the trouble, and someone doing my back same as I said." },
    ],
  },
  {
    id: 'showering', label: 'Showering', type: 'text', reviewed: false,
    value: 'Arthur can stand at the rail and do most of the showering himself. He needs a hand with his back. Someone should be nearby in case he goes dizzy, as this has happened once or twice.',
    sourceLines: [{ index: 10, highlight: "I can stand at the rail and do most of it myself, just need a hand with my back again, and honestly someone just being nearby in case I go a bit dizzy, it's happened once or twice." }],
  },
  {
    id: 'dressing', label: 'Dressing (include buttons, zips, laces and poppers)', type: 'text', reviewed: false,
    value: "Arthur struggles with buttons, particularly shirt buttons, especially when cold as his fingers won't cooperate. He needs help getting arms into jumpers when his shoulder is stiff, and with his jacket if going out.",
    sourceLines: [{ index: 12, highlight: "My fingers just won't do what I tell them some mornings, especially if it's cold. Shirt buttons are the worst offender. Jumper's alright once it's over my head but someone needs to help me get my arms in sometimes if my shoulder's stiff." }],
  },
  {
    id: 'oral-care', label: 'Oral care', type: 'text', reviewed: false,
    value: 'Arthur can brush his own teeth. He needs someone to open the toothpaste tube and put some on the brush for him as his grip has gone.',
    sourceLines: [{ index: 14, highlight: "it's opening the toothpaste tube that does me in, my grip's gone. So someone needs to open it and put a bit on the brush for me really." }],
  },
  {
    id: 'personal-grooming', label: 'Personal grooming (include use of electrical equipment e.g. hair dryers/tongs/rollers, shavers and trimmers)', type: 'text', reviewed: false,
    value: 'Arthur uses an electric razor but needs someone to hold the mirror steady and switch it on for him as the button is too fiddly. He cannot manage the hair dryer plug either as his hands are not strong enough.',
    sourceLines: [{ index: 16, highlight: "I need someone to hold the mirror steady, and switch it on for me, the little button's too fiddly. And don't get me started on the hairdryer plug, I can't manage that either, my hands just aren't strong enough anymore." }],
  },
  {
    id: 'skin-care', label: 'Skin care', type: 'text', reviewed: false,
    value: "Arthur's legs get very dry, especially in winter, and crack around the ankles. His lower back also gets dry. He needs someone to apply cream to his lower back after washing as he cannot reach it himself.",
    sourceLines: [{ index: 18, highlight: "my legs get ever so dry, especially in winter, cracks a bit round the ankles if I don't keep on top of it. And my lower back too. So I need someone to put the cream on there after I've washed, I can't reach it myself" }],
  },
  {
    id: 'continence-care', label: 'Continence care', type: 'text', reviewed: false,
    value: 'Arthur wears pads day and night since his operation. He needs help checking and changing them and tidying up afterwards.',
    sourceLines: [{ index: 20, highlight: "I wear pads, day and night now, since the operation. I'll need help checking them and changing them, and just tidying up after" }],
  },

  { id: 'products-1', label: 'Products', type: 'table', columns: ['Product', 'Purpose'] },
  { id: 'risk-control-1', label: 'Risk and control measures', type: 'table', columns: ['Risk', 'Control measures'] },

  {
    id: 'body-shape', label: 'Body shape/size/limbs/restrictions', type: 'text', reviewed: false,
    value: 'Hip and back problems. Stiff shoulder (bad for a few weeks). Cannot twist. Limited grip and hand strength.',
    sourceLines: [
      { index: 2, highlight: 'my hip was playing up.' },
      { index: 22, highlight: "my shoulder, I mentioned it for the jumper, that's been bad for a few weeks now" },
    ],
  },
  { id: 'weight-bear', label: 'Ability to weight bear', type: 'text' },
  { id: 'walk', label: 'Ability to walk', type: 'text' },
  { id: 'standing-lying', label: 'Standing from lying down and the reverse', type: 'text' },
  { id: 'standing-sitting', label: 'Standing from sitting and the reverse', type: 'text' },
  { id: 'front-of-chair', label: 'Moving to the front of a chair', type: 'text' },
  { id: 'transferring', label: 'Transferring from chair, bed, wheelchair', type: 'text' },
  { id: 'steps-stairs', label: 'Using steps and stairs', type: 'text' },
  { id: 'mobilising-outside', label: 'Mobilising outside the home', type: 'text' },
  { id: 'rolling-technique', label: 'Use of rolling technique', type: 'text' },
  {
    id: 'mh-bathing', label: 'Moving & handling support when bathing', type: 'text', reviewed: false,
    value: 'Arthur needs help getting in and out of the bath. Getting up is particularly difficult. Carer to assist with washing his back.',
    sourceLines: [{ index: 8, highlight: "I need help getting in and out of it, it's the getting up again that's the trouble, and someone doing my back same as I said." }],
  },
  {
    id: 'mh-showering', label: 'Moving & handling support when showering', type: 'text', reviewed: false,
    value: 'Arthur can stand at the rail. Carer to assist with washing his back and to remain nearby in case of dizziness.',
    sourceLines: [{ index: 10, highlight: "I can stand at the rail and do most of it myself, just need a hand with my back again, and honestly someone just being nearby in case I go a bit dizzy, it's happened once or twice." }],
  },
  {
    id: 'mh-washing', label: 'Moving & handling support when washing', type: 'text', reviewed: false,
    value: 'Arthur can manage at the sink himself. Carer to assist with washing his back as he cannot twist to reach it.',
    sourceLines: [{ index: 4, highlight: "I can't twist round to do it myself anymore, so whoever's helping me needs to do that bit." }],
  },
  { id: 'mh-toilet', label: 'Moving & handling support when using the toilet', type: 'text' },
  { id: 'equipment-location', label: 'Equipment location', type: 'table', columns: ['Equipment', 'Location'] },
  { id: 'equipment-safety', label: 'Equipment safety', type: 'table', columns: ['Equipment', 'Safety check'] },
  {
    id: 'risks-control-measures',
    label: 'Risks and control measures',
    type: 'table',
    columns: ['Hazard', 'Risk', 'Control measures'],
    rows: [['Dizziness when showering', 'Risk of fall in shower', 'Carer to remain nearby when Arthur is showering']],
    reviewed: false,
    sourceLines: [{ index: 10, highlight: "someone just being nearby in case I go a bit dizzy, it's happened once or twice." }],
  },

  { id: 'coshh-products', label: 'Products', type: 'table', columns: ['Product', 'Purpose'] },
];

// Same "page-layout groups this single-section document is actually broken
// into" idea as WiitmGroup — a heading, an optional sub-heading, and the
// field(s) that follow it, in source order.
export interface PersonalCareGroup {
  heading?: string;
  subheading?: string;
  fieldIds: string[];
}

export const PERSONAL_CARE_GROUPS: PersonalCareGroup[] = [
  { subheading: 'Personal care needs assessment for Arthur', fieldIds: [] },
  {
    heading: 'What personal care support do I require?',
    fieldIds: ['washing', 'bathing', 'showering', 'dressing', 'oral-care', 'personal-grooming', 'skin-care', 'continence-care'],
  },
  { heading: 'Use of products and objects to support me', fieldIds: ['products-1', 'risk-control-1'] },
  {
    heading: 'How to support with moving and handling?',
    fieldIds: [
      'body-shape', 'weight-bear', 'walk', 'standing-lying', 'standing-sitting', 'front-of-chair', 'transferring',
      'steps-stairs', 'mobilising-outside', 'rolling-technique', 'mh-bathing', 'mh-showering', 'mh-washing',
      'mh-toilet', 'equipment-location', 'equipment-safety', 'risks-control-measures',
    ],
  },
  {
    heading: 'COSHH Assessment - for personal care and moving and handling items (such as deodorant)',
    subheading: 'Only use supermarket bought products. All containers must be originals clearly displaying labels which are readable.',
    fieldIds: [],
  },
  { subheading: 'If you cannot see the name or instructions you are not permitted to use the product', fieldIds: ['coshh-products'] },
];
