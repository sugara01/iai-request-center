import assert from 'node:assert/strict';
import test from 'node:test';
import { mapInboxApproval, mapUserNotification, mealGroupHasPendingApproval } from './inbox.mjs';

test('maps each vehicle approval stage to its corresponding action', () => {
  const vehicle = {
    request_type: 'vehicle',
    request_id: 'RQ2611260100',
    requester_name: 'Ayu Lestari',
    request_date: '2026-11-26T08:00:00.000Z',
    current_status: 'Submitted',
    vehicle_id: '12',
  };

  assert.equal(mapInboxApproval(vehicle).actionStage, 'vehicle_availability');
  assert.equal(mapInboxApproval({ ...vehicle, current_status: 'PendingPlantDirectorApproval' }).actionStage, 'plant_director');
  assert.equal(mapInboxApproval(vehicle).vehicleId, 12);
});

test('maps a meal approval as one request group, including mixed statuses', () => {
  const approval = mapInboxApproval({
    request_type: 'meal',
    request_id: 'EMR-261126-01',
    requester_name: 'Ayu Lestari',
    request_date: '2026-11-26T08:00:00.000Z',
    current_status: 'Mixed',
    vehicle_id: null,
  });

  assert.equal(approval.key, 'meal:EMR-261126-01');
  assert.equal(approval.actionStage, 'meal_review');
  assert.equal(approval.vehicleId, undefined);
});

test('maps notification IDs and nullable fields to the API response shape', () => {
  const notification = mapUserNotification({
    id: '7',
    event_type: 'request_approved',
    related_entity_type: null,
    related_entity_id: null,
    created_at: '2026-11-26T08:00:00.000Z',
    read_at: null,
  });

  assert.equal(notification.id, 7);
  assert.equal(notification.eventType, 'request_approved');
  assert.equal(notification.relatedEntityId, undefined);
  assert.equal(notification.readAt, undefined);
});

test('maps vehicle workflow metadata into notification responses', () => {
  const notification = mapUserNotification({
    id: '9',
    event_type: 'vehicle_available',
    related_entity_type: 'vehicle_request',
    related_entity_id: 'RQ2611270108',
    metadata: { status: 'PendingPlantDirectorApproval', adminDecision: 'Available', adminNote: 'Vehicle is available' },
    created_at: '2026-11-27T10:00:00.000Z',
    read_at: null,
  });

  assert.equal(notification.eventType, 'vehicle_available');
  assert.equal(notification.metadata.status, 'PendingPlantDirectorApproval');
  assert.equal(notification.metadata.adminDecision, 'Available');
  assert.equal(notification.metadata.adminNote, 'Vehicle is available');
});

test('maps requester submission and password-change notification event types', () => {
  for (const eventType of ['request_submitted', 'password_changed']) {
    const notification = mapUserNotification({
      id: '8',
      event_type: eventType,
      related_entity_type: eventType === 'request_submitted' ? 'vehicle_request' : 'user',
      related_entity_id: eventType === 'request_submitted' ? 'RQ2611260100' : 'user@example.com',
      created_at: '2026-11-26T08:00:00.000Z',
      read_at: null,
    });

    assert.equal(notification.eventType, eventType);
  }
});

test('only keeps meal groups actionable while at least one service date is pending', () => {
  assert.equal(mealGroupHasPendingApproval([{ current_status: 'Submitted' }, { current_status: 'Approved' }]), true);
  assert.equal(mealGroupHasPendingApproval([{ current_status: 'Approved' }, { current_status: 'Rejected' }]), false);
});
