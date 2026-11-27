export function mapInboxApproval(row) {
  const type = row.request_type;
  const status = row.current_status;
  const actionStage = type === 'vehicle'
    ? status === 'Submitted' ? 'vehicle_availability' : 'plant_director'
    : 'meal_review';

  return {
    key: `${type}:${row.request_id}`,
    requestId: row.request_id,
    type,
    requester: row.requester_name,
    requestDate: row.request_date,
    currentStatus: status,
    actionStage,
    vehicleId: row.vehicle_id == null ? undefined : Number(row.vehicle_id),
  };
}

export function mapUserNotification(row) {
  return {
    id: Number(row.id),
    eventType: row.event_type,
    relatedEntityType: row.related_entity_type ?? undefined,
    relatedEntityId: row.related_entity_id ?? undefined,
    metadata: row.metadata && typeof row.metadata === 'object' ? row.metadata : {},
    createdAt: row.created_at,
    readAt: row.read_at ?? undefined,
  };
}

export function mealGroupHasPendingApproval(rows) {
  return rows.some((row) => row.current_status === 'Submitted');
}
