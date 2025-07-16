import { Request, Response } from "express";
import { Contact, ContactDocument } from "../models/Contact"; // ✅ named import
import mongoose from "mongoose"; // ✅ needed for ObjectId

export const identify = async (req: Request, res: Response) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({ message: "Email or phone number is required" });
    }

    // Step 1: Find contacts with matching email or phone
    const matchedContacts = await Contact.find({
      $or: [
        { email: email || null },
        { phoneNumber: phoneNumber || null }
      ]
    });

    // ✅ Step 2: If no match found, create new primary contact
    if (matchedContacts.length === 0) {
      const newPrimary = await Contact.create({
        email,
        phoneNumber,
        linkPrecedence: 'primary',
      });

      return res.status(200).json({
        contact: {
          primaryContatctId: newPrimary.id,
          emails: [newPrimary.email],
          phoneNumbers: [newPrimary.phoneNumber],
          secondaryContactIds: [],
        }
      });
    }

    // Step 3: Find all linked contacts
    const allContactIds = new Set<string>();
    matchedContacts.forEach((contact) => {
      allContactIds.add((contact._id as mongoose.Types.ObjectId).toString());
      if (contact.linkedId) allContactIds.add(contact.linkedId.toString());
    });

    const allLinkedContacts = await Contact.find({
      $or: [
        { _id: { $in: Array.from(allContactIds) } },
        { linkedId: { $in: Array.from(allContactIds) } }
      ]
    });

    // Step 4: Determine the oldest (primary) contact
    let primaryContact: ContactDocument = allLinkedContacts[0];
    for (const contact of allLinkedContacts) {
      if (contact.createdAt < primaryContact.createdAt) {
        primaryContact = contact;
      }
    }

    // Step 5: Check if exact email+phone exists already
    const alreadyExists = allLinkedContacts.some((c) =>
      c.email === email && c.phoneNumber === phoneNumber
    );

    const emails = new Set<string>();
    const phoneNumbers = new Set<string>();
    const secondaryIds: string[] = [];

    allLinkedContacts.forEach((contact) => {
      if (contact.email) emails.add(contact.email);
      if (contact.phoneNumber) phoneNumbers.add(contact.phoneNumber);
      if (contact._id && primaryContact._id && contact._id.toString() !== primaryContact._id.toString()) {
        secondaryIds.push(contact.id);
      }
    });

    // Step 6: If new data → create a secondary contact
    if (!alreadyExists) {
      const newContact = await Contact.create({
        email,
        phoneNumber,
        linkedId: primaryContact._id,
        linkPrecedence: 'secondary',
      });

      if (newContact.email) emails.add(newContact.email);
      if (newContact.phoneNumber) phoneNumbers.add(newContact.phoneNumber);
      secondaryIds.push(newContact.id);
    }

    // Step 7: Return final response
    return res.status(200).json({
      contact: {
        primaryContatctId: primaryContact.id,
        emails: [primaryContact.email, ...Array.from(emails).filter(e => e !== primaryContact.email)],
        phoneNumbers: [primaryContact.phoneNumber, ...Array.from(phoneNumbers).filter(p => p !== primaryContact.phoneNumber)],
        secondaryContactIds: secondaryIds
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
