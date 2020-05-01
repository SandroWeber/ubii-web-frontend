export class Dataset {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.nodes = [];
    this.links = [];
  }

  addNode(node) {
    this.nodes.push(node);
  }

  addLink(link) {
    this.links.push(link);
  }

  toMatrix() {
    let result = [],
      temp1,
      temp2;
    this.nodes.forEach(node1 => {
      //create rows
      temp1 = [];

      this.nodes.forEach(node2 => {
        //create columns

        //graph is directed therefore matrix is not symmetrical
        temp2 = this.links.find(
          link => link.source == node1.id && link.target == node2.id
        );

        if (temp2 != null) {
          temp1.push(true);
        } else {
          temp1.push(false);
        }
      });

      result.push(temp1);
    });
    return result;
  }

  isCyclic() {
    //Got this algorithm from here https://www.geeksforgeeks.org/detect-cycle-in-a-graph/
    let recursiveCheck = (i, visited, recStack, matrix) => {
      if (recStack[i]) {
        return true;
      }

      if (visited[i]) {
        return false;
      }

      visited[i] = true;
      recStack[i] = true;

      for (let j = 0; j < matrix[i].length; j++) {
        if (matrix[i][j]) {
          if (recursiveCheck(j, visited, recStack, matrix)) {
            return true;
          }
        }
      }

      recStack[i] = false;

      return false;
    };

    let visited = [];
    let recStack = [];
    this.nodes.forEach(() => {
      visited.push(false);
      recStack.push(false);
    });
    let matrix = this.toMatrix(); //translatedToMatrix(dataset);
    for (let i = 0; i < this.nodes.length; i++) {
      if (recursiveCheck(i, visited, recStack, matrix)) {
        return true;
      }
    }
    return false;
  }
}
