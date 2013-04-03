JsHamcrest.Integration.QUnit();
JsMockito.Integration.QUnit();

module("Cell Tests", {
    setup: function() {
        this.cell = new Tetris.Cell('red', this.grid = mock(Tetris.Grid));
    }
});

test("Cell#move should erase cell's old position if it has one", function() {
    this.cell.x = 1;
    this.cell.y = 1;
    when(this.grid).getCell(1,1).thenReturn(this.cell);
    this.cell.move(1,2);
    verify(this.grid).setCell(1,1,undefined);
    verify(this.grid).setCell(1,2, this.cell);
    ok('mockito verifications passed');
});

test("Cell#move should not overwrite old position if occupied by another cell", function(){
    this.cell.x = 1;
    this.cell.y = 1;
    when(this.grid).getCell(1,1).thenReturn([]);
    this.cell.move(1,2);
    verify(this.grid, times(0)).setCell(1,1,undefined);
    verify(this.grid).setCell(1,2, this.cell);
    ok('mockito verifications passed');
});

test("Cell#move should not overwrite old position if position is undefined", function(){
    this.cell.move(1,2);
    verify(this.grid, times(0)).getCell(anything(), anything());
    verify(this.grid).setCell(1,2,this.cell);
    ok('mockito verifications passed');
});