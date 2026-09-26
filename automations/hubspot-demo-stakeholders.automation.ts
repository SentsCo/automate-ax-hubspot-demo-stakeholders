import { automation, t } from "automate.ax"
import { hubspot } from "automate.ax/hubspot"
import { slack } from "automate.ax/slack"

export default automation(
  "Prepare follow-up tasks for every contact on a completed demo deal",
  {
    parameters: [
      {
        label: "Demo completed stage ID",
        name: "demoCompletedStageId",
        type: "text",
      },
      {
        label: "Fallback HubSpot owner ID",
        name: "fallbackOwnerId",
        type: "text",
      },
      {
        label: "Contact role property name",
        name: "contactRolePropertyName",
        type: "text",
      },
      { label: "Primary role value", name: "primaryRoleValue", type: "text" },
      {
        label: "HubSpot task-to-contact association type ID",
        name: "taskContactAssociationTypeId",
        type: "number",
      },
      {
        label: "Slack conversation ID",
        name: "slackConversationId",
        type: "text",
      },
    ],
  },
  ({ parameters }) => {
    const completedDemo = hubspot
      .onDealUpdated()
      .filter(
        ({ propertyChanges }) =>
          propertyChanges.dealstage === parameters.demoCompletedStageId,
      )
    const deal = hubspot.getDeal({
      recordId: completedDemo.objectId,
      associations: ["contacts"],
      properties: ["dealname", "hubspot_owner_id"],
    })
    const ownerId = deal.transform(
      ({ properties }) =>
        properties.find((property) => property.name === "hubspot_owner_id")
          ?.value || parameters.fallbackOwnerId,
    )
    const contacts = deal.transform(
      ({ associations }) =>
        associations.find(
          (association) => association.objectType === "contacts",
        )?.records ?? [],
    )

    const tasks = contacts.each((reference) => {
      const contact = hubspot.getContact({
        recordId: reference.id,
        properties: [
          "firstname",
          "lastname",
          "email",
          parameters.contactRolePropertyName,
        ],
      })
      const details = contact.transform(({ properties }) => {
        const name =
          ["firstname", "lastname"]
            .map(
              (key) =>
                properties.find((property) => property.name === key)?.value,
            )
            .filter(Boolean)
            .join(" ") || "this stakeholder"
        const role = properties.find(
          (property) => property.name === parameters.contactRolePropertyName,
        )?.value
        const isPrimary =
          role?.trim().toLowerCase() ===
          parameters.primaryRoleValue.trim().toLowerCase()

        return {
          name,
          email:
            properties.find((property) => property.name === "email")?.value ||
            "No email on the contact",
          subject: isPrimary ? "Call" : "Review recap for",
          nextStep: isPrimary
            ? "Call the primary stakeholder to discuss next steps after reviewing the demo notes."
            : "Review the demo notes and prepare a tailored recap for this stakeholder. A person should decide whether to send it.",
          taskType: isPrimary ? ("CALL" as const) : ("TODO" as const),
        }
      })

      return hubspot.createTask({
        timestamp: deal.updatedAt,
        ownerId,
        subject: t`${details.subject} ${details.name} after the demo`,
        body: t`Deal ID: ${deal.id}\nContact: ${details.email}\n${details.nextStep}`,
        taskType: details.taskType,
        associations: [
          {
            toRecordId: contact.id,
            types: [
              {
                associationCategory: "HUBSPOT_DEFINED",
                associationTypeId: parameters.taskContactAssociationTypeId,
              },
            ],
          },
        ],
      })
    })

    slack.sendMessage({
      conversation: parameters.slackConversationId,
      text: t`Demo follow-up review: ${tasks.transform((created) => created.length)} HubSpot tasks created for deal ${deal.id}. Primary contacts have call tasks; other contacts have recap review tasks. No email was sent.`,
    })
  },
)
