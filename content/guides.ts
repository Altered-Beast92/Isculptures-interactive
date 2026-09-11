export type Guide = {
  slug: string; title: string; summary: string; category: string;
  image: string; project: string; service: string; serviceLabel: string; enquiryRoute?: string;
  sections: { id: string; title: string; paragraphs: string[]; points?: string[] }[];
};
const occasionGuides: Guide[] = [
  {
    slug: 'personalised-baby-shower-keepsakes', title: 'Personalised baby shower favours and keepsakes',
    summary: 'Planning favours for baby shower guests or a keepsake for the parents: choosing a design, getting the wording right and timing your order.',
    category: 'BABY SHOWERS', image: 'gift-boxes', project: 'personalised-gift-boxes',
    service: 'bonbonniere-custom', serviceLabel: 'Personalised keepsakes', enquiryRoute: 'bulk',
    sections: [
      { id: 'recipients', title: 'Guest favour or gift for the parents?', paragraphs: ['First decide who the piece is for. A favour for every guest needs a set quantity and should be easy to hand out. A keepsake for the parents might have different wording, a different size and nicer packaging. Keep the two separate in your brief.', 'For guest favours, decide whether it’s one per person, per couple or per household, and add a few spares to the total. Our minimum is 10 units. If you’d also like a separate gift for the parents, ask about it when you enquire about the favours.'] },
      { id: 'design', title: 'Pick a design that suits how it’ll be used', paragraphs: ['A small sculpture, a personalised tag or a gift box each work differently on the day. Send us a reference and tell us whether it’s for display, for each place setting or packaging for a gift you’re supplying. A photo is a good starting point, and we’ll confirm what can actually be made.', 'Think about where the keepsake ends up after the shower and how guests will carry it home. Give us sizes and any packaging limits. If you have anything in mind beyond decoration, like a toy or something that touches food, tell us, because that needs to be checked separately.'] },
      { id: 'wording', title: 'Sort out the wording early', paragraphs: ['Tell us if the design will use the family name, a short thank-you, the shower date or each guest’s name. If the baby’s name isn’t decided yet, say so, and we’ll agree when you need to confirm it.', 'Send one checked list of wording with spelling and punctuation. Point out what’s the same on every piece and what changes. If family members are helping decide, pick one person to send us the final version.'] },
      { id: 'presentation', title: 'Budget for the finished favour', paragraphs: ['Say whether your budget covers just the pieces or also tags, ribbon, boxes, assembly and freight. For a big guest list, ask us about simplifying the design or cutting down on variations while keeping the details you care about.', 'Tell us the delivery postcode, the shower date and the earlier date you need everything in hand. Leave yourself time to check and set up. We’ll confirm materials, finish, price and timing once we’ve reviewed your brief.'] },
      { id: 'brief', title: 'What to send with your enquiry', paragraphs: ['You can start with a rough number and a reference photo. Just mark anything you haven’t decided yet.'], points: ['Who gets each piece and how many you need', 'A reference design, how it’ll be used and a rough size', 'Shared wording and any individual names', 'Colours, finish and packaging ideas', 'Budget, delivery postcode and the date you need it'] },
    ],
  },
  {
    slug: 'personalised-wedding-bonbonniere', title: 'Planning personalised wedding bonbonniere',
    summary: 'Ideas for wedding bonbonniere, working out quantities from your guest list, and what to tell us about names, packaging and delivery.',
    category: 'WEDDINGS', image: 'event-favours', project: 'ribbon-finished-event-favours',
    service: 'bonbonniere-custom', serviceLabel: 'Wedding bonbonniere', enquiryRoute: 'bulk',
    sections: [
      { id: 'ideas', title: 'Decide what the favour is for', paragraphs: ['A small sculpture can sit at each place setting, a personalised tag can finish off a gift, and a boxed piece can be handed out as guests leave. Decide which role it plays first, then we can work on a design that suits. The boxed favours with ribbon in our gallery are one example.', 'Is it mainly a reminder of the day, part of the table styling or something guests will display at home? Send us your colours, a reference you like and how much room there is on the table. Don’t assume a finish or box in a photo is included; check it in your quote.'] },
      { id: 'guest-list', title: 'Work out the quantity', paragraphs: ['Decide whether each person, couple or household gets one. Count the bridal party and any spares separately, then give us the total you want quoted. Our minimum is 10 units.', 'If each favour doubles as a place card with a guest’s name, send one final list that matches your seating plan. Ask how late changes are handled before you approve, since additions can affect price and timing.'] },
      { id: 'personalisation', title: 'Keep names and wording readable', paragraphs: ['Your names and date, a short message, or each guest’s name all take different amounts of work. Give us the exact text and where it goes. We’ll check the wording fits the size of the piece rather than assuming a long message will fit on something small.', 'Pick one person to approve the names, dates, colours and packaging together. Ask what the approval step includes and whether a physical sample or extra design work costs more.'] },
      { id: 'transport', title: 'Packing and transport', paragraphs: ['Tell us if guests will be travelling with their favours, or if the order is going straight to the venue or your planner. Mention individual boxes, ribbon, tags and anything you’ll assemble yourself. If space is tight, ask for the packed size.', 'For a destination wedding, talk to us about shipping before you settle on a design. We’ll confirm whether delivery and timing work for your order.'] },
      { id: 'quote', title: 'Getting a quote', paragraphs: ['Give us a budget range and say whether it includes design, printing, packaging and freight. Fewer versions or simpler packaging may change the price, so ask us to quote those options rather than expecting a fixed price per guest.', 'Send the quantity, a design reference, wording, delivery postcode, wedding date and the date you need them. Leave time to check and set up after they arrive. We’ll confirm materials, finish, pricing and timing after reviewing it.'] },
    ],
  },
  {
    slug: 'christening-baptism-keepsakes', title: 'Christening and baptism keepsakes and favours',
    summary: 'Planning christening or baptism favours and keepsakes: religious symbols, names and dates, guest numbers and packaging.',
    category: 'CHRISTENINGS & BAPTISMS', image: 'boxed-keepsakes', project: 'personalised-boxed-keepsakes',
    service: 'bonbonniere-custom', serviceLabel: 'Religious keepsakes & bonbonniere', enquiryRoute: 'bulk',
    sections: [
      { id: 'purpose', title: 'Family keepsake or guest favours?', paragraphs: ['A piece the family keeps is different from favours handed out to guests. Tell us who gets each version, how it’ll be displayed or given out, and how many you need. Our minimum is 10 units, and you can ask about separate pieces for the family or godparents at the same time.', 'For favours, decide whether it’s one per guest or one per household. Add any spares you want to keep, and point out any versions with different names or messages.'] },
      { id: 'symbols', title: 'Choosing the religious imagery', paragraphs: ['If you’d like a cross, a saint or another symbol, send a clear reference and tell us which details matter to you. Traditions differ, so it’s better to show us the exact image than leave it to guesswork.', 'We’ll let you know if the reference will work at the size you want. Only send artwork you have permission to use, and check our interpretation carefully when you approve the design.'] },
      { id: 'wording', title: 'Names, dates and language', paragraphs: ['Give us the exact spelling of the name, the ceremony date and any short message, including accents, punctuation and which language it’s in. Ask how longer wording will fit before choosing a small design.', 'If the date isn’t final, say so. Choose one person to collect the family’s feedback and approve the wording. Changes after approval may affect timing and cost.'] },
      { id: 'presentation', title: 'The piece and its packaging', paragraphs: ['Our boxed keepsakes gallery shows clear boxes, white bows and gold tags. Use the photos to show us the style you like, then we’ll confirm colours, finish, size and packaging for your order.', 'Tell us if the favours will be set out at the reception, handed out after the ceremony or collected by a planner. Mention any space limits and who’s putting the final display together.'] },
      { id: 'timing', title: 'Timing and delivery', paragraphs: ['Send the ceremony date, the earlier date you need the order delivered, and the postcode. Leave time to check everything and set up. We’ll make sure the timeline works before confirming.', 'Include the quantity, a reference image, wording, sizes, packaging ideas and your budget. Mark anything you’re unsure about as a question. We’ll confirm materials, pricing and lead time for your final brief.'] },
    ],
  },
];
export const guides: Guide[] = [
  {
    slug: 'bulk-3d-printing-quote-checklist', title: 'What to include in a bulk 3D printing quote request',
    summary: 'What to send us so we can quote your bulk order properly, even if you don’t have a 3D file yet.',
    category: 'PLANNING YOUR ORDER', image: 'event-favours', project: 'ribbon-finished-event-favours',
    service: 'wholesale', serviceLabel: 'Bulk & trade orders',
    sections: [
      { id: 'purpose', title: 'Start with what it’s for', paragraphs: ['Tell us what the product is and who it’s for. An event keepsake, something you’ll sell in a shop and a working part all need different things from the design and packaging. A photo or rough sketch is plenty to start with. You don’t need a finished model.', 'Give rough dimensions in millimetres and point out which measurements matter. If it has to fit onto or around something else, show us how and give those measurements. A photo alone won’t tell us that.'] },
      { id: 'quantity', title: 'Quantity and versions', paragraphs: ['Our minimum is 10 units. Tell us how many you need in this order, then list anything that changes between pieces, like names, colours, sizes or designs. Ten identical pieces are a different job to ten with individual names.', 'If you’ll reorder, give the quantity per batch and your rough yearly total separately. Mark estimates as estimates so we quote the order you’re actually ready to place.'] },
      { id: 'delivery', title: 'When and where it’s going', paragraphs: ['Include the delivery postcode and the date you need the pieces in your hands. For events, give the event date too. Design, approval, printing, packaging and freight all have to fit into that time.', 'If you have a budget, say whether it’s meant to cover design, packaging and delivery or just the pieces. We’ll confirm lead time and price once we’ve looked at the brief.'] },
      { id: 'checklist', title: 'Checklist', paragraphs: ['Copy these into your enquiry. If you don’t know something yet, just write “not sure”.'], points: ['What it is, what it’s for, and a photo or file', 'Rough dimensions and anything it has to fit', 'Quantity for this order and number of versions', 'Personalisation, colour and finish', 'Boxes, labels or other packaging', 'Delivery postcode, the date you need it and the event date', 'Budget and whether you’ll reorder'] },
    ],
  },
  {
    slug: 'ordering-custom-event-favours', title: 'How to order custom event favours',
    summary: 'Working out how many favours you need, getting names and wording right, choosing packaging and making sure everything arrives in time.',
    category: 'EVENTS & KEEPSAKES', image: 'boxed-keepsakes', project: 'personalised-boxed-keepsakes',
    service: 'bonbonniere-custom', serviceLabel: 'Bonbonniere & keepsakes',
    sections: [
      { id: 'quantity', title: 'Work out how many you need', paragraphs: ['First decide who gets one: each guest, each couple, each household or each table. That turns your guest list into a number. Add a few extras for late RSVPs or keepsakes and include them in the quantity you ask us to quote.', 'Planners ordering for several events should list each one separately with its own deadline. Tell us what stays the same across them and what changes, like names, dates or ribbon colours.'] },
      { id: 'personalisation', title: 'Keep one wording list', paragraphs: ['Names, dates and short messages make a favour feel like it belongs to the day. Send the exact spelling, capitals and punctuation, and tell us where the wording should go. We’ll let you know if it fits the size and design.', 'If a few people are signing off, pick one person to send us the final feedback. Before we start, ask how approval works and whether a sample costs extra. Changing wording after approval can affect price and timing.'] },
      { id: 'packaging', title: 'Think about packaging early', paragraphs: ['The boxed keepsakes in our gallery use clear boxes, white bows and gold tags. Use them as a reference for the look you’re after, and we’ll confirm what’s available for your order.', 'Let us know if you need individual boxes, personalised tags, ribbon or extra protection for transport. Describe how you expect the favours to look when they arrive, including anything you plan to assemble yourself.'] },
      { id: 'timing', title: 'Plan from the delivery date', paragraphs: ['Give us both the event date and the date you need the favours delivered. Leave time to check them, put them together and set up the tables. We’ll check printing and shipping times before confirming.', 'Our minimum is 10 units. To get started, send your rough quantity, a reference you like, the wording, packaging ideas and your delivery postcode.'] },
    ],
  },
  {
    slug: 'what-affects-bulk-3d-printing-cost', title: 'What affects the cost of bulk 3D printing?',
    summary: 'Quantity is only part of the price. Here’s how design work, size, finish, personalisation and packaging affect what you’ll pay.',
    category: 'PRICING', image: 'gift-boxes', project: 'personalised-gift-boxes',
    service: 'wholesale', serviceLabel: 'Bulk orders',
    sections: [
      { id: 'design', title: 'What you’re starting with', paragraphs: ['A finished 3D model and a design we build from your sketch are very different amounts of work. Tell us what you already have and what still needs designing or personalising. Sometimes a supplied file needs changes before it can be printed.', 'Ask for design and setup costs to be shown separately from the print run. If you plan to reorder, ask which costs would come up again if the design or wording changes.'] },
      { id: 'size', title: 'Size, detail and finish', paragraphs: ['Dimensions, shape, material and finish all change how a piece is made. The price of a small version isn’t a guide to the price of a bigger one.', 'Tell us which features are essential and where you’re flexible. We’ll suggest materials and finishes for how the piece will be used. A method that works for a decorative piece won’t necessarily suit a functional part.'] },
      { id: 'variants', title: 'Versions and personalisation', paragraphs: ['Ten identical pieces and ten pieces with different names are different jobs. Tell us how many designs, colours and wording changes there are so we can price the setup as well as the quantity.', 'The gift boxes in our gallery come in different colours, ribbons and message plaques. If you want something similar, list the exact combination rather than assuming everything in the photo is included.'] },
      { id: 'compare', title: 'Comparing quotes', paragraphs: ['Before comparing totals, check what each quote actually includes. It’s only a fair comparison if the specification and delivery are the same.'], points: ['Design work and how many revisions', 'Quantity, size, material and finish', 'Personalisation and number of versions', 'Samples or approval steps', 'Packaging and assembly', 'Freight, tax and delivery date'] },
      { id: 'request', title: 'Getting your quote', paragraphs: ['Send your budget along with the quantity and what the pieces are for, and say whether the budget includes packaging and freight. We’ll check it’s doable and confirm pricing for your order. Every custom design is different, so there isn’t a standard price per piece.'] },
    ],
  },
  {
    slug: 'planning-repeat-production-orders', title: 'Planning repeat 3D printing orders for your business',
    summary: 'How to set up a product you’ll reorder: separating your first batch from your forecast, locking in the specification and handling changes.',
    category: 'ONGOING SUPPLY', image: 'commemorative-icons', project: 'commemorative-religious-icons',
    service: 'ongoing-supply', serviceLabel: 'Ongoing supply', enquiryRoute: 'supply',
    sections: [
      { id: 'forecast', title: 'Your first order and your forecast', paragraphs: ['Start with what you need first: the quantity, where it’s going and when. Then give us a rough idea of how often you’ll reorder and your yearly total. That lets us plan future batches without treating a forecast as a firm order.', 'If demand spikes around certain events or seasons, tell us when. Mention whether deliveries go to one place or several. Capacity, timing and the arrangement itself need to be agreed before either of us commits to regular orders.'] },
      { id: 'specification', title: 'Agree what stays the same', paragraphs: ['A repeatable order needs more than a product name. Write down the approved design version, dimensions, wording, colour, finish and packaging. For a working part, include the fit or performance it has to meet.', 'Talk to us about whether an approval sample makes sense, what it costs and what you’ll check it for. Any quality checks need to be agreed for your actual product.'], points: ['Design version and approved personalisation', 'Dimensions and anything critical', 'Material, colour and finish', 'Packaging, labels and delivery', 'Who approves each batch and handles changes'] },
      { id: 'changes', title: 'When something changes', paragraphs: ['A new name, updated logo, different material or new size can change the job. Send a clear list of changes before asking for the next batch, rather than assuming the last quote still applies.', 'Keep the approved version and the changes together so everyone can see what’s different. Ask us to confirm any effect on price and delivery before going ahead.'] },
      { id: 'arrangement', title: 'Purchasing and paperwork', paragraphs: ['If your organisation uses purchase orders, supplier onboarding or confidentiality agreements, mention it when you first enquire so we can look at it alongside the brief.', 'Our ongoing supply page is an invitation to talk, not a fixed offer. Pricing, delivery commitments and quality terms are agreed between us. Start with your first batch and a realistic forecast.'] },
    ],
  },
  ...occasionGuides,
];
export const getGuide = (slug: string) => guides.find(guide => guide.slug === slug);

