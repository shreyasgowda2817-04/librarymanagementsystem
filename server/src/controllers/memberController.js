import Member from "../models/member.js";
import Transaction from "../models/transaction.js";
import { createAuditEntry } from "./auditController.js";

export const getMembers = async (req, res, next) => {
  try {
    const members = await Member.find({}).sort({ createdAt: -1 });
    const activeTxs = await Transaction.find({
      $or: [
        { returned: false },
        { returned: true, finePaid: false, penalty: { $gt: 0 } }
      ]
    });
    
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const penaltyPerDay = Number(process.env.PENALTY_PER_DAY || 5);

    const membersWithFines = members.map(m => {
      let hasOverdue = false;
      let totalFine = 0;
      
      const memberTxs = activeTxs.filter(tx => tx.memberId.toString() === m._id.toString());
      
      memberTxs.forEach(tx => {
        let txPenalty = 0;
        
        if (tx.returned) {
          txPenalty = tx.penalty || 0;
        } else {
          const due = new Date(tx.dueDate);
          due.setUTCHours(0, 0, 0, 0);
          if (today > due) {
            hasOverdue = true;
            const diffMs = today - due;
            const lateDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
            txPenalty = lateDays * penaltyPerDay;
          }
        }
        
        if (!tx.finePaid) {
          totalFine += txPenalty;
        }
      });
      
      return { ...m.toJSON(), hasOverdue, totalFine };
    });

    res.json(membersWithFines);
  } catch (err) {
    next(err);
  }
};

export const createMember = async (req, res, next) => {
  try {
    const { name, email, phone, rollNo, department } = req.body;

    const member = await Member.create({ name, email, phone, rollNo, department });
    
    // 📝 Audit Entry
    await createAuditEntry(req.user, "Member Registered", member.name, `Institutional relay for ${member.email} established.`);

    res.status(201).json(member);
  } catch (err) {
    next(err);
  }
};

export const updateMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    const updated = await Member.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Member not found" });

    // 📝 Audit Entry
    await createAuditEntry(req.user, "Member Modified", updated.name, `Identity node attributes synchronized for ${updated.email}.`);

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const deleteMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await Member.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Member not found" });

    // 📝 Audit Entry
    await createAuditEntry(req.user, "Member Terminated", deleted.name, `Institutional relay for ${deleted.email} severed.`);

    res.json({ message: "Member deleted" });
  } catch (err) {
    next(err);
  }
};

