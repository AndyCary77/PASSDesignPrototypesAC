import type { FormField } from '../CareBridgePage';
import type { FillPatch } from './nutritionHydrationData';

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
// Repeating-group shapes, as the live platform lays them out (see EditableItemsField in CareBridgePage.tsx): a Product
// is picked from a fixed list with a free-text Location; a risk is a free-text Hazard / Risk / Control measures trio.
export const PRODUCT_OPTIONS = ['Flannel', 'Towels', 'Soap', 'Shampoo', 'Toothbrush', 'Other'];
const PRODUCT_ITEM = [{ label: 'Product', options: PRODUCT_OPTIONS }, { label: 'Location' }];
const RISK_ITEM = [{ label: 'Hazard' }, { label: 'Risk' }, { label: 'Control measures' }];

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

  { id: 'products-1', label: 'Products', type: 'table', columns: ['Product', 'Location'], itemColumns: PRODUCT_ITEM },
  { id: 'risk-control-1', label: 'Risk and control measures', type: 'table', columns: ['Hazard', 'Risk', 'Control measures'], itemColumns: RISK_ITEM },

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
  { id: 'equipment-location', label: 'Equipment location', type: 'table', columns: ['Equipment', 'Location'], itemColumns: [{ label: 'Equipment' }, { label: 'Location' }] },
  { id: 'equipment-safety', label: 'Equipment safety', type: 'table', columns: ['Equipment', 'Safety check'], itemColumns: [{ label: 'Equipment' }, { label: 'Safety check' }] },
  {
    id: 'risks-control-measures',
    label: 'Risks and control measures',
    type: 'table',
    columns: ['Hazard', 'Risk', 'Control measures'],
    itemColumns: RISK_ITEM,
    rows: [['Dizziness when showering', 'Risk of fall in shower', 'Carer to remain nearby when Arthur is showering']],
    itemReviews: [{
      reviewed: false,
      sourceLines: [{ index: 10, highlight: "someone just being nearby in case I go a bit dizzy, it's happened once or twice." }],
    }],
  },

  { id: 'coshh-products', label: 'Products', type: 'table', columns: ['Product', 'Location'], itemColumns: PRODUCT_ITEM },
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

// ─── Vera Bramwell: the same assessment, starting blank ──────────────────────
// Her list has this assessment INCOMPLETE — nothing filled in, no recording linked. On its page she picks a recording
// (the web-platform equivalent of attaching one) and Assessment Hero drafts it, including NEW ITEMS in the repeating
// groups (products, risks, equipment) — which is the case AIOP-25788 is about: the draft adds whole items, not only
// answers to fields that were already there. Shares the field definitions above, so the form is identical to Arthur's.

/** Every field of the assessment with its answer stripped — what a customer with nothing recorded yet sees. */
export const PERSONAL_CARE_BLANK_FIELDS: FormField[] = PERSONAL_CARE_FIELDS.map(
  ({ value, rows, reviewed, sourceLines, ...rest }) => rest,
);

/** The same page layout, with the customer's own first name in the opening line. */
export const personalCareGroupsFor = (firstName: string): PersonalCareGroup[] =>
  PERSONAL_CARE_GROUPS.map(g => ({
    ...g,
    subheading: g.subheading?.replace('Arthur', firstName),
  }));

const L = (index: number, highlight: string) => ({ index, highlight });

/**
 * What Vera's 'personal-care-visit' recording (CareBridgePage.tsx, VERA_PERSONAL_CARE_TRANSCRIPT) answers. Every
 * captured field points at the words it came from; the item fields carry several rows each. Anything not listed
 * (continence, grooming, transfers, stairs, the toilet, …) was not discussed, so stays blank.
 */
export const VERA_PERSONAL_CARE_FILL: Record<string, FillPatch> = {
  'personal-care-visit': {
    washing: {
      value: 'Vera can wash her face and hands at the sink herself, but her hands are stiff with arthritis so she cannot wring out a flannel. The carer needs to wash her back and feet, as she cannot reach them since her fall.',
      sourceLines: [L(3, "I can do my face and hands myself, but my hands are stiff with the arthritis so I can't wring a flannel out. Someone needs to wash my back and my feet")],
    },
    bathing: {
      value: 'Vera can no longer get down into the bath, so she does not have baths.',
      sourceLines: [L(5, "I can't get down into the bath any more")],
    },
    showering: {
      value: 'Vera has a shower on Tuesdays and Fridays, sitting on her perching stool. She would like someone with her the whole time, as the floor gets very wet and she is frightened of slipping.',
      sourceLines: [L(5, "it's a shower on Tuesdays and Fridays. I sit on the perching stool and I'd like someone with me the whole time, the floor gets so wet and I'm frightened of slipping")],
    },
    dressing: {
      value: 'Vera cannot manage buttons with her fingers, so she wears cardigans with zips. She cannot bend to put on her socks and shoes because of her hip, so the carer needs to do this for her.',
      sourceLines: [L(7, "Buttons are no good with my fingers, so I wear cardigans with zips. I can't bend for my socks and shoes because of my hip, so someone needs to put those on for me.")],
    },
    'oral-care': {
      value: 'Vera has her own teeth at the front and a partial denture at the back. She can brush her teeth herself. The carer needs to clean the denture and put it in its pot at night, as she cannot manage the clasps.',
      sourceLines: [L(9, "I've got my own teeth at the front and a partial denture at the back. I can brush them myself, but someone needs to clean the denture and put it in its pot at night")],
    },
    'skin-care': {
      value: 'Vera has a sore on her left heel which the district nurse is treating. She has been told to keep the weight off it and keep her feet well creamed. The carer needs to put cream on her feet and legs morning and night, as she cannot bend that far.',
      sourceLines: [L(11, "It's my left heel. They've told me to keep the weight off it and keep my feet well creamed, so someone needs to put cream on my feet and legs morning and night")],
    },
    // Items — each row becomes a new card on the form.
    'products-1': {
      rows: [
        ['Flannel', 'Airing cupboard on the landing, second shelf'],
        ['Towels', 'Airing cupboard on the landing, second shelf'],
        ['Soap', 'Shelf above the bathroom sink'],
        ['Shampoo', 'Shelf above the bathroom sink'],
        ['Toothbrush', 'In the glass on the bathroom sink'],
        ['Other', 'Barrier cream: top drawer of the cabinet by her bed'],
      ],
      itemSourceLines: [
        [L(13, 'My flannels and towels are in the airing cupboard on the landing, second shelf.')],
        [L(13, 'My flannels and towels are in the airing cupboard on the landing, second shelf.')],
        [L(13, 'Soap and shampoo are on the shelf above the bathroom sink')],
        [L(13, 'Soap and shampoo are on the shelf above the bathroom sink')],
        [L(13, 'my toothbrush lives in the glass on the sink')],
        [L(13, 'The barrier cream is in the top drawer of the cabinet by my bed.')],
      ],
      sourceLines: [L(13, 'My flannels and towels are in the airing cupboard on the landing, second shelf. Soap and shampoo are on the shelf above the bathroom sink, and my toothbrush lives in the glass on the sink. The barrier cream is in the top drawer of the cabinet by my bed.')],
    },
    'risk-control-1': {
      rows: [[
        'Wet soap and shampoo bottle slipping from her grip in the shower',
        'Vera could drop them and slip while reaching to pick them up',
        'Use a pump bottle for shampoo and keep soap in a wash mitt. The carer keeps products within reach and hands them to Vera.',
      ]],
      sourceLines: [L(15, "I can't grip a bar of soap, it shoots out of my hands. And the shampoo bottle's the same when it's wet, I've dropped it more than once in the shower and nearly slipped reaching for it.")],
    },
    'body-shape': {
      value: 'Stiff hip since her fall. Arthritis in her hands, with stiff fingers and limited grip. Can feel dizzy on standing.',
      sourceLines: [L(3, 'my hands are stiff with the arthritis'), L(17, "My hip's stiff and I get dizzy sometimes when I stand up")],
    },
    walk: {
      value: 'Vera walks indoors with her walking frame.',
      sourceLines: [L(17, 'I use my walking frame indoors.')],
    },
    'standing-sitting': {
      value: 'Vera takes a while to stand up. The carer should stand beside her and let her get her balance before she sets off with the frame. She uses a raised toilet seat downstairs.',
      sourceLines: [L(19, 'It takes me a while. Someone needs to stand beside me and let me get my balance before I set off with the frame.')],
    },
    'mh-bathing': {
      value: 'Not applicable. Vera cannot get down into the bath and showers instead.',
      sourceLines: [L(5, "I can't get down into the bath any more")],
    },
    'mh-showering': {
      value: 'Vera sits on the perching stool. The carer stays with her throughout and keeps the floor as dry as possible.',
      sourceLines: [L(5, 'I sit on the perching stool and I\'d like someone with me the whole time')],
    },
    'mh-washing': {
      value: 'Vera washes her face and hands at the sink. The carer washes her back and feet.',
      sourceLines: [L(3, 'Someone needs to wash my back and my feet')],
    },
    'equipment-location': {
      rows: [
        ['Walking frame', 'Beside her armchair in the lounge'],
        ['Perching stool', 'In the shower'],
        ['Raised toilet seat', 'Downstairs toilet'],
      ],
      itemSourceLines: [
        [L(17, 'It lives beside my armchair in the lounge.')],
        [L(5, 'I sit on the perching stool')],
        [L(19, 'The toilet seat downstairs is a raised one')],
      ],
      sourceLines: [L(17, 'It lives beside my armchair in the lounge.'), L(19, 'The toilet seat downstairs is a raised one')],
    },
    'equipment-safety': {
      rows: [
        ['Perching stool', 'Check the rubber feet are on and the legs are locked before Vera sits down'],
        ['Walking frame', 'Check the rubber feet for wear'],
      ],
      itemSourceLines: [
        [L(21, "The rubber feet on the perching stool get loose, so check they're on and the legs are locked before I sit.")],
        [L(21, "The frame's feet want a look too, they wear down.")],
      ],
      sourceLines: [L(21, "The rubber feet on the perching stool get loose, so check they're on and the legs are locked before I sit. The frame's feet want a look too, they wear down.")],
    },
    'risks-control-measures': {
      rows: [
        [
          'Wet shower room floor',
          'Vera could slip and fall. She has already had a fall that fractured her hip.',
          'Carer stays with Vera for the whole shower and dries the floor afterwards.',
        ],
        [
          'Dizziness when standing up',
          'Vera could lose her balance and fall. She has said her new blood pressure tablets make her dizzy on standing.',
          'Carer stands beside Vera and lets her get her balance before she sets off with the frame. Report any dizziness to the office.',
        ],
      ],
      itemSourceLines: [
        [L(5, "the floor gets so wet and I'm frightened of slipping")],
        [L(17, 'I get dizzy sometimes when I stand up')],
      ],
      sourceLines: [L(5, "the floor gets so wet and I'm frightened of slipping"), L(17, 'I get dizzy sometimes when I stand up')],
    },
  },
};
