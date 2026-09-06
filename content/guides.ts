export type Guide = {
  slug: string; title: string; summary: string; category: string;
  image: string; project: string; service: string; serviceLabel: string; enquiryRoute?: string;
  sections: { id: string; title: string; paragraphs: string[]; points?: string[] }[];
};
export const guides: Guide[] = [
  {
    slug: 'bulk-3d-printing-quote-checklist', title: 'What to include in a bulk 3D printing quote request',
    summary: 'A practical brief helps us assess the design, quantity and delivery requirements together. Here is what to send, even without a finished 3D file.',
    category: 'PLANNING YOUR ORDER', image: 'event-favours', project: 'ribbon-finished-event-favours',
    service: 'wholesale', serviceLabel: 'Bulk & trade orders',
    sections: [
      { id: 'purpose', title: 'Start with the purpose', paragraphs: ['Describe the product and who it is for. An event keepsake, a retail item and a functional component can have very different design and packaging requirements. A reference photograph or sketch is a useful starting point; you do not need to arrive with a finished model.', 'Include approximate dimensions in millimetres and explain which measurements matter. If the piece needs to fit another object, show the connection and give the relevant dimensions rather than relying on a photograph alone.'] },
      { id: 'quantity', title: 'Separate the quantity from the variations', paragraphs: ['Our bulk orders start at 10 units. State how many pieces you need in this order, then describe any different names, colours, sizes or designs. A batch of identical pieces and a batch with individual wording require different preparation.', 'For repeat work, give the quantity per batch separately from estimated annual demand. Label an estimate as an estimate so the quote can be based on the order you are ready to discuss.'] },
      { id: 'delivery', title: 'Give the date you need delivery', paragraphs: ['Include the delivery postcode and the date the pieces need to be in your hands. For events, also give the event date. Design review, approvals, production, packaging and freight all need to fit that schedule.', 'If you have a budget range, say whether it covers design, packaging and delivery as well as the pieces themselves. Lead time, suitability and pricing are confirmed after review.'] },
      { id: 'checklist', title: 'Your enquiry checklist', paragraphs: ['Copy these points into your project brief. Unknown details can be marked “please advise”.'], points: ['Product, intended use and reference image or file', 'Approximate dimensions and any critical fit requirements', 'Quantity for this order and number of variants', 'Personalisation, preferred colour and finish', 'Individual boxes, labels or other packaging needs', 'Delivery postcode, required arrival date and event date if relevant', 'Budget range and likely repeat demand'] },
    ],
  },
  {
    slug: 'ordering-custom-event-favours', title: 'Ordering custom event favours: quantities, personalisation and packaging',
    summary: 'Plan the piece and its presentation together, from guest numbers and wording to the date your favours need to arrive.',
    category: 'EVENTS & KEEPSAKES', image: 'boxed-keepsakes', project: 'personalised-boxed-keepsakes',
    service: 'bonbonniere-custom', serviceLabel: 'Bonbonniere & keepsakes',
    sections: [
      { id: 'quantity', title: 'Decide what one favour represents', paragraphs: ['Start by deciding whether each guest, couple, household or table receives a piece. This helps turn a guest list into an order quantity. If you want extras for keepsakes or late additions, include them in the quantity you ask us to quote.', 'For planners ordering across several occasions, separate the events and their deadlines. Let us know which details stay the same and which change, such as names, dates or ribbon colours.'] },
      { id: 'personalisation', title: 'Keep a single approved wording list', paragraphs: ['Names, dates and short messages can make a keepsake specific to an occasion. Send the exact spelling, capitalisation and punctuation you want, and identify where the wording should appear. We review whether the text suits the size and design.', 'If several people are involved in approval, nominate one person to send the final consolidated feedback. Discuss the approval format and any sample costs before production. Changes to approved wording may affect the scope and schedule.'] },
      { id: 'packaging', title: 'Plan the whole presentation', paragraphs: ['The boxed keepsakes in our gallery show clear presentation boxes, white bows and gold details. Use these as a visual reference when describing the look you want; the available combination is confirmed for your order.', 'Ask whether you need individual presentation boxes, personalised tags, ribbon, or protective packing for transport. Describe the finished arrangement you expect to receive, including any assembly you intend to handle yourself.'] },
      { id: 'timing', title: 'Work back from arrival, not the event', paragraphs: ['Give both the event date and the date you need the favours delivered. Include time for your own checking, assembly and table setup. We assess the production and shipping requirements before confirming a timeframe.', 'Bulk enquiries start at 10 units. To begin, send your estimated quantity, a reference you like, the required wording, packaging preferences and delivery postcode.'] },
    ],
  },
  {
    slug: 'what-affects-bulk-3d-printing-cost', title: 'What affects the cost of a custom 3D printed batch?',
    summary: 'Quantity is only one part of a quote. Design preparation, size, finish, variants and packaging also shape the scope of your order.',
    category: 'UNDERSTANDING YOUR QUOTE', image: 'gift-boxes', project: 'personalised-gift-boxes',
    service: 'wholesale', serviceLabel: 'Discuss a bulk quote',
    sections: [
      { id: 'design', title: 'The starting design matters', paragraphs: ['A ready-to-review model and a new design developed from a sketch involve different work. Tell us what you already have and what still needs to be designed or personalised. File review may identify changes needed before production.', 'Ask the quote to distinguish design or setup work from the production run. If you expect to reorder, also ask which parts of the scope would need to be reviewed again when the design or wording changes.'] },
      { id: 'size', title: 'Size and detail affect the production brief', paragraphs: ['Dimensions, geometry, material and the required finish influence how a piece can be produced. A price for a small version should not be treated as a fixed guide for a larger one.', 'Explain which features are essential and where you have flexibility. Material and finish options are confirmed for the intended use; a decorative example does not establish suitability for a functional part.'] },
      { id: 'variants', title: 'Count the versions as well as the pieces', paragraphs: ['Ten identical pieces and ten individually named pieces are different briefs. Share the number of designs, colours and wording variations so the preparation can be considered alongside the quantity.', 'The gift boxes in our gallery illustrate variations in colour, ribbon and message plaques. When asking about a similar order, specify the combination you want rather than assuming every photographed detail is included.'] },
      { id: 'compare', title: 'Compare the complete scope', paragraphs: ['Check what each quote includes before comparing its total. A useful comparison covers the same product specification and delivery requirements.'], points: ['Design preparation and agreed revisions', 'Quantity, dimensions, material and finish', 'Personalisation and number of variants', 'Any sample or approval stage', 'Presentation packaging and assembly', 'Freight, applicable tax and required delivery date'] },
      { id: 'request', title: 'Ask for a quote around your priorities', paragraphs: ['Send your budget range along with the quantity and intended use. Say whether the budget includes packaging and freight. We will review feasibility and confirm pricing for the agreed scope; there is no universal per-piece rate for every custom design.'] },
    ],
  },
  {
    slug: 'planning-repeat-production-orders', title: 'Planning repeat orders for your business or organisation',
    summary: 'A repeat order starts with a clear specification. Separate the first batch, your forecast and the details that need to stay consistent.',
    category: 'ONGOING SUPPLY', image: 'commemorative-icons', project: 'commemorative-religious-icons',
    service: 'ongoing-supply', serviceLabel: 'Discuss ongoing supply', enquiryRoute: 'supply',
    sections: [
      { id: 'forecast', title: 'Separate the first order from the forecast', paragraphs: ['Tell us what you need first: quantity, destination and required delivery date. Then outline your expected ordering frequency and annual demand. This gives us a basis for discussing future batches without treating a forecast as a confirmed order.', 'If demand changes around events or seasons, describe those peaks. Include whether deliveries go to one location or several. Capacity, timing and the arrangement itself need to be agreed before a recurring commitment.'] },
      { id: 'specification', title: 'Agree what should stay the same', paragraphs: ['A repeatable brief records more than the product name. Identify the approved design version, dimensions, wording, colour, finish and packaging. For a functional item, include the fit or performance requirements that need to be assessed.', 'Discuss whether an approval sample is appropriate, what it would cost and what you will use it to check. Any acceptance criteria and checks need to be agreed for the actual product.'], points: ['Design version and approved personalisation', 'Dimensions and any critical requirements', 'Material, colour and finish', 'Packaging, labels and delivery arrangement', 'Who approves the batch and handles changes'] },
      { id: 'changes', title: 'Give changes their own review', paragraphs: ['A new name, revised logo, different material or new size may change the work involved. Send a clear revision list before requesting the next run, rather than assuming a previous quote covers an altered design.', 'Keep the approved reference and revised brief together so everyone can identify what changed. Ask for the impact on price and delivery to be confirmed before proceeding.'] },
      { id: 'arrangement', title: 'Bring purchasing requirements into the conversation', paragraphs: ['If your organisation uses purchase orders, supplier onboarding or confidentiality requirements, mention them at enquiry stage. We can review the requirements alongside the production brief.', 'Our ongoing-supply page is an invitation to discuss an arrangement. Pricing, delivery commitments, quality acceptance and other terms remain subject to review and mutual agreement. Start with your first-batch requirements and a realistic forecast.'] },
    ],
  },
];
export const getGuide = (slug: string) => guides.find(guide => guide.slug === slug);

