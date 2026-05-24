import { DetectionVisibilityController } from '../../src/core/camera/DetectionVisibilityController';

jest.mock('../../src/core/debug', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

describe('DetectionVisibilityController', () => {
  let controller: DetectionVisibilityController;

  beforeEach(() => {
    controller = new DetectionVisibilityController();
  });

  afterEach(() => {
    controller.destroy();
  });

  it('starts visible', () => {
    expect(controller.isVisible()).toBe(true);
  });

  it('hide makes invisible', () => {
    controller.hide();
    expect(controller.isVisible()).toBe(false);
  });

  it('show makes visible', () => {
    controller.hide();
    controller.show();
    expect(controller.isVisible()).toBe(true);
  });

  it('setVisibility controls visibility', () => {
    controller.setVisibility(false);
    expect(controller.isVisible()).toBe(false);
    controller.setVisibility(true);
    expect(controller.isVisible()).toBe(true);
  });

  it('destroy hides visibility', () => {
    controller.destroy();
    expect(controller.isVisible()).toBe(false);
  });
});
